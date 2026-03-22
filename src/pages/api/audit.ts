import type { APIRoute } from 'astro';
import { nanoid } from 'nanoid';

interface AuditCheck {
  score: number;
  found: boolean;
  details?: string;
}

interface AuditResult {
  id: string;
  url: string;
  domain: string;
  score: number;
  checks: {
    meta: AuditCheck;
    robots: AuditCheck;
    llms_txt: AuditCheck;
    llm_ld: AuditCheck;
    schema: AuditCheck;
    https: AuditCheck;
    structure: AuditCheck;
    speed: AuditCheck;
  };
}

// Weights for each check
const WEIGHTS = {
  meta: 20,
  robots: 10,
  llms_txt: 20,
  llm_ld: 15,
  schema: 15,
  structure: 10,
  https: 5,
  speed: 5,
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { url, variant } = await request.json();

    if (!url) {
      return new Response(JSON.stringify({ error: 'URL required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Require full URL with protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return new Response(JSON.stringify({ error: 'URL must start with https://' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let targetUrl: URL;
    try {
      targetUrl = new URL(url);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid URL' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const domain = targetUrl.hostname;
    const baseUrl = `${targetUrl.protocol}//${targetUrl.host}`;

    // Run all checks in parallel
    const startTime = Date.now();

    const [
      homepageResult,
      robotsResult,
      llmsTxtResult,
      llmLdResult,
    ] = await Promise.all([
      fetchWithTimeout(`${baseUrl}/`, 10000),
      fetchWithTimeout(`${baseUrl}/robots.txt`, 5000),
      fetchWithTimeout(`${baseUrl}/llms.txt`, 5000),
      fetchWithTimeout(`${baseUrl}/.well-known/llm-index.json`, 5000),
    ]);

    const responseTime = Date.now() - startTime;

    // Analyze homepage
    const homepageHtml = homepageResult.ok ? await homepageResult.text() : '';

    // Check: Meta description
    const metaCheck = checkMetaDescription(homepageHtml);

    // Check: robots.txt
    const robotsCheck = checkRobotsTxt(robotsResult);

    // Check: llms.txt
    const llmsTxtCheck = checkLlmsTxt(llmsTxtResult);

    // Check: LLM-LD
    const llmLdCheck = await checkLlmLd(llmLdResult);

    // Check: Schema.org
    const schemaCheck = checkSchemaOrg(homepageHtml);

    // Check: Content structure
    const structureCheck = checkContentStructure(homepageHtml);

    // Check: HTTPS
    const httpsCheck: AuditCheck = {
      score: targetUrl.protocol === 'https:' ? 100 : 0,
      found: targetUrl.protocol === 'https:',
    };

    // Check: Speed
    const speedCheck: AuditCheck = {
      score: responseTime < 1000 ? 100 : responseTime < 3000 ? 50 : 0,
      found: responseTime < 3000,
      details: `${responseTime}ms`,
    };

    // Calculate total score
    const checks = {
      meta: metaCheck,
      robots: robotsCheck,
      llms_txt: llmsTxtCheck,
      llm_ld: llmLdCheck,
      schema: schemaCheck,
      structure: structureCheck,
      https: httpsCheck,
      speed: speedCheck,
    };

    const totalScore = Object.entries(checks).reduce((sum, [key, check]) => {
      const weight = WEIGHTS[key as keyof typeof WEIGHTS];
      return sum + (check.score / 100) * weight;
    }, 0);

    const auditId = nanoid();

    // Store in D1
    const db = (locals.runtime?.env as any)?.DB;
    if (db) {
      await db.prepare(`
        INSERT INTO leads (id, created_at, domain, url, score, score_meta, score_robots, score_llms_txt, score_llm_ld, score_schema, score_structure, score_https, score_speed, ab_variant, converted)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
      `).bind(
        auditId,
        new Date().toISOString(),
        domain,
        targetUrl.href,
        Math.round(totalScore),
        checks.meta.score,
        checks.robots.score,
        checks.llms_txt.score,
        checks.llm_ld.score,
        checks.schema.score,
        checks.structure.score,
        checks.https.score,
        checks.speed.score,
        variant || 'A'
      ).run();
    }

    const result: AuditResult = {
      id: auditId,
      url: targetUrl.href,
      domain,
      score: Math.round(totalScore),
      checks,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Audit error:', error);
    return new Response(JSON.stringify({ error: 'Audit failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

async function fetchWithTimeout(url: string, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'GarageAuditBot/1.0 (AI Readiness Checker)',
      },
    });
    clearTimeout(timeoutId);
    return response;
  } catch {
    clearTimeout(timeoutId);
    return new Response(null, { status: 0 });
  }
}

function checkMetaDescription(html: string): AuditCheck {
  const match = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i) ||
                html.match(/<meta\s+content=["']([^"']+)["']\s+name=["']description["']/i);

  if (!match) {
    return { score: 0, found: false };
  }

  const description = match[1];
  const length = description.length;

  // Ideal: 50-160 chars
  if (length >= 50 && length <= 160) {
    return { score: 100, found: true, details: `${length} chars` };
  } else if (length >= 30 && length <= 200) {
    return { score: 70, found: true, details: `${length} chars (suboptimal length)` };
  } else {
    return { score: 30, found: true, details: `${length} chars (poor length)` };
  }
}

function checkRobotsTxt(response: Response): AuditCheck {
  if (!response.ok) {
    return { score: 0, found: false };
  }

  // Basic check - robots.txt exists
  return { score: 100, found: true };
}

function checkLlmsTxt(response: Response): AuditCheck {
  if (!response.ok) {
    return { score: 0, found: false };
  }

  return { score: 100, found: true };
}

async function checkLlmLd(response: Response): Promise<AuditCheck> {
  if (!response.ok) {
    return { score: 0, found: false };
  }

  try {
    const json = await response.json();
    // Check for basic LLM-LD structure
    if (json['@context'] && json['@type']) {
      return { score: 100, found: true };
    }
    return { score: 50, found: true, details: 'Invalid structure' };
  } catch {
    return { score: 0, found: false, details: 'Invalid JSON' };
  }
}

function checkSchemaOrg(html: string): AuditCheck {
  // Look for JSON-LD
  const jsonLdMatch = html.match(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);

  if (jsonLdMatch && jsonLdMatch.length > 0) {
    return { score: 100, found: true, details: `${jsonLdMatch.length} JSON-LD block(s)` };
  }

  // Look for microdata
  if (html.includes('itemtype="http://schema.org') || html.includes('itemtype="https://schema.org')) {
    return { score: 70, found: true, details: 'Microdata found' };
  }

  return { score: 0, found: false };
}

function checkContentStructure(html: string): AuditCheck {
  let score = 0;

  // Check for heading hierarchy
  const hasH1 = /<h1[\s>]/i.test(html);
  const hasH2 = /<h2[\s>]/i.test(html);

  if (hasH1) score += 40;
  if (hasH2) score += 30;

  // Check for lists
  const hasLists = /<ul[\s>]/i.test(html) || /<ol[\s>]/i.test(html);
  if (hasLists) score += 30;

  return {
    score,
    found: score > 50,
    details: `H1: ${hasH1 ? '✓' : '✗'}, H2: ${hasH2 ? '✓' : '✗'}, Lists: ${hasLists ? '✓' : '✗'}`,
  };
}
