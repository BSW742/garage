import { collectThemeEvidence, askForTheme } from '../../lib/theme';
import type { APIRoute } from 'astro';
import { lookAtImages, type ImageVerdict } from '../../lib/vision';

export const prerender = false;

export interface ScrapedData {
  url: string;
  title: string;
  description: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  services: string[];
  aboutText: string;
  heroImage: string | null;
  galleryImages: string[];
  logoUrl: string | null;
  faviconUrl: string | null;
  industry: string;
  businessType: string;
  socials: Record<string, string>;
  hours: [string, string][];
  brandColour: string | null;
  /** Every image we found, judged by nobody — the vision pass decides what they are */
  candidateImages: string[];
  vision: ImageVerdict[] | null;
  /** 0 to 1: is there enough real material here to build a site. Null if we never looked. */
  mediaConfidence: number | null;
  /** We could not read the page. Whatever else is here was salvaged. */
  blocked: boolean;
  blockedReason: string;
  /** Their logo vanishes unless what sits behind it is dark */
  logoNeedsDark: boolean;
  themeEvidence?: string;  // raw font/colour/shape evidence, judged in the handler
  theme?: import('../../lib/theme').Theme | null;
  salvageNote?: string;
  /** How the HTML was obtained — plain fetch, or a real browser. Null when unremarkable. */
  renderNote?: string;
}

/** What scrapeWebsite needs from the environment. Everything here is optional:
 *  without it the scrape behaves exactly as it did before. */
export interface ScrapeEnv {
  CF_ACCOUNT_ID?: string;
  CF_BROWSER_TOKEN?: string;
}

// Industry detection with weighted keywords
const INDUSTRY_KEYWORDS: Record<string, { keywords: string[]; weight: number }[]> = {
  medical: [
    { keywords: ['hospital'], weight: 10 },
    { keywords: ['healthcare', 'health care', 'medical centre', 'medical center'], weight: 6 },
    { keywords: ['medical', 'clinic', 'patient', 'ward', 'nurse', 'physician'], weight: 4 },
    { keywords: ['maternity', 'palliative', 'aged care', 'respite', 'hospice'], weight: 5 },
    { keywords: ['treatment', 'therapy', 'surgery', 'doctor', 'outpatient', 'inpatient'], weight: 3 },
  ],
  dental: [
    { keywords: ['dental', 'dentist'], weight: 5 },
    { keywords: ['teeth', 'orthodont', 'oral health', 'smile'], weight: 3 },
  ],
  restaurant: [
    { keywords: ['restaurant', 'cafe', 'bistro', 'eatery', 'diner'], weight: 5 },
    { keywords: ['dining', 'cuisine', 'chef', 'food menu', 'lunch', 'dinner', 'breakfast'], weight: 3 },
  ],
  construction: [
    { keywords: ['construction', 'builder', 'contractor'], weight: 5 },
    { keywords: ['renovation', 'building', 'roofing', 'concrete'], weight: 3 },
  ],
  plumbing: [
    { keywords: ['plumbing', 'plumber'], weight: 5 },
    { keywords: ['drain', 'pipe', 'leak', 'hot water', 'bathroom'], weight: 3 },
  ],
  electrical: [
    { keywords: ['electrician', 'electrical'], weight: 5 },
    { keywords: ['wiring', 'power', 'circuit', 'lighting'], weight: 3 },
  ],
  landscaping: [
    { keywords: ['landscaping', 'landscaper'], weight: 5 },
    { keywords: ['garden', 'lawn', 'mowing', 'outdoor'], weight: 3 },
  ],
  legal: [
    { keywords: ['lawyer', 'attorney', 'law firm', 'solicitor'], weight: 5 },
    { keywords: ['legal', 'litigation', 'barrister'], weight: 3 },
  ],
  accounting: [
    { keywords: ['accountant', 'accounting', 'cpa'], weight: 5 },
    { keywords: ['tax', 'bookkeeping', 'financial'], weight: 3 },
  ],
  realestate: [
    { keywords: ['real estate', 'realtor', 'property'], weight: 5 },
    { keywords: ['homes', 'houses', 'listings', 'agent'], weight: 3 },
  ],
  fitness: [
    { keywords: ['gym', 'fitness', 'crossfit'], weight: 5 },
    { keywords: ['workout', 'training', 'exercise', 'personal trainer'], weight: 3 },
  ],
  salon: [
    { keywords: ['rugby club', 'football club', 'basketball club', 'sports club'], weight: 5 },
    { keywords: ['donate', 'charitable trust', 'registered charity', 'fundraising'], weight: 5 },
    { keywords: ['hall hire', 'venue hire', 'community hall', 'memorial hall'], weight: 5 },
    { keywords: ['early childhood', 'daycare', 'kindergarten', 'preschool', '20 hours ece'], weight: 5 },
    { keywords: ['grades', 'juniors', 'clubrooms', 'sponsors', 'subs'], weight: 3 },
    { keywords: ['tamariki', 'whanau', 'enrolment', 'ratios'], weight: 3 },
    { keywords: ['sauna', 'bathhouse', 'ice bath', 'contrast therapy'], weight: 5 },
    { keywords: ['pottery', 'ceramics', 'jewellery workshop', 'silversmith'], weight: 5 },
    { keywords: ['kiln', 'wheel throwing', 'the bench', 'maker'], weight: 3 },
    { keywords: ['plunge', 'cold plunge', 'infrared', 'steam room'], weight: 3 },
    { keywords: ['salon', 'hair salon', 'beauty salon'], weight: 5 },
    { keywords: ['hair', 'beauty', 'spa', 'nails', 'styling'], weight: 3 },
  ],
  automotive: [
    { keywords: ['mechanic', 'auto repair', 'car service'], weight: 5 },
    { keywords: ['vehicle', 'tyre', 'tire', 'brake'], weight: 3 },
  ],
  veterinary: [
    { keywords: ['veterinary', 'vet clinic', 'animal hospital'], weight: 5 },
    { keywords: ['pet', 'animal', 'dog', 'cat'], weight: 2 },
  ],
  photography: [
    { keywords: ['photography', 'photographer'], weight: 5 },
    { keywords: ['photo', 'portrait', 'wedding', 'studio'], weight: 3 },
  ],
  tech: [
    { keywords: ['software', 'web development', 'app development'], weight: 5 },
    { keywords: ['technology', 'digital', 'it services'], weight: 3 },
  ],
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { url } = await request.json();

    if (!url) {
      return new Response(JSON.stringify({ error: 'URL required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const env = (locals.runtime?.env as any) || {};

    let scraped: ScrapedData;
    try {
      scraped = await scrapeWebsite(url, env);
    } catch (readError) {
      // The page is unreadable, which is not the same as there being nothing to
      // have. Salvage the mark and the colours off the well-known icon path and
      // hand back a thin result — an empty start loses them in two seconds.
      const reason = readError instanceof Error ? readError.message : 'unreadable';
      const origin = new URL(url).origin;
      const salvage = await salvageIcon(origin, new URL(url).hostname);
      const icon = salvage.url;
      const salvaged = {
        url, title: '', description: '', tagline: '', phone: '', email: '', address: '',
        services: [], aboutText: '', heroImage: null, galleryImages: [],
        logoUrl: icon, faviconUrl: icon, industry: 'default', businessType: '',
        socials: {}, hours: [], brandColour: null,
        candidateImages: icon ? [icon] : [], vision: null, mediaConfidence: null,
        blocked: true, blockedReason: reason, logoNeedsDark: false,
        salvageNote: salvage.note,
      } as ScrapedData;

      const key = env.ANTHROPIC_API_KEY;
      if (key && icon) {
        // Inline it: this icon often comes from a source the model cannot fetch.
        const seen = await lookAtImages(key, [icon], { inline: true });
        salvaged.salvageNote = `${salvage.note}; vision ${seen.ok ? 'ok' : seen.note}`;
        if (seen.ok) {
          salvaged.vision = seen.images;
          if (seen.palette) salvaged.brandColour = seen.palette;
          // A favicon that turns out to be a photo or a scrap of chrome is no logo.
          if (seen.images[0] && seen.images[0].kind === 'furniture') salvaged.logoUrl = null;
          salvaged.logoNeedsDark = seen.logoNeedsDark;
        }
      }

      return new Response(JSON.stringify(salvaged), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Look at the images instead of guessing from their filenames. This is
    // allowed to fail: if it does we keep the heuristic result, because a
    // degraded scrape beats no scrape.
    const apiKey = env.ANTHROPIC_API_KEY;
    if (apiKey && scraped.candidateImages.length) {
      const seen = await lookAtImages(apiKey, scraped.candidateImages);
      if (seen.ok) {
        scraped.vision = seen.images;
        scraped.mediaConfidence = seen.confidence;

        if (seen.logo) scraped.logoUrl = seen.logo;
        else if (
          scraped.logoUrl &&
          seen.images.find((v) => v.url === scraped.logoUrl)?.kind === 'furniture'
        ) {
          // The regexes' favourite mistake: the first icon in the header.
          scraped.logoUrl = null;
        }

        if (seen.hero) scraped.heroImage = seen.hero;
        // An honestly empty gallery is better than one full of social badges —
        // empty is a state we can now recognise and ask about.
        scraped.galleryImages = seen.photos.filter((u) => u !== seen.hero).slice(0, 8);
        if (seen.palette) scraped.brandColour = seen.palette;
        scraped.logoNeedsDark = seen.logoNeedsDark;
      }
    }

    // Their design language, judged once. Allowed to fail or say no: a site
    // with no theme still gets everything above.
    if (apiKey && scraped.themeEvidence) {
      try {
        scraped.theme = await askForTheme(apiKey, scraped.themeEvidence, url);
      } catch { scraped.theme = null; }
    }
    delete scraped.themeEvidence;

    return new Response(JSON.stringify(scraped), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Scrape error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to scrape site',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// When the page itself is unreadable we are not necessarily beaten. /favicon.ico
// is a well-known path, WordPress redirects it to the site icon, and generates a
// standard size ladder from the same source. That is enough for their real mark
// and their real colours — which is the difference between a page that looks like
// their business and a generic shell nobody stays on.
async function salvageIcon(baseUrl: string, host: string): Promise<{ url: string | null; note: string }> {
  const get = async (u: string) => {
    try {
      return await fetch(u, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
            '(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          Accept: 'image/avif,image/webp,image/png,image/*,*/*;q=0.8',
        },
        redirect: 'follow',
      });
    } catch {
      return null;
    }
  };

  const first = await get(`${baseUrl}/favicon.ico`);
  const type = first?.headers.get('content-type') || '';
  if (!first || !first.ok || !/^image\//i.test(type)) {
    // Their own server will not hand it to us — but the icon has been public for
    // years and the search engines already hold a copy. Google fetched it with
    // their crawler, so the block on our address never comes into it.
    const mirrored = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=256`;
    const viaIndex = await get(mirrored);
    if (viaIndex && viaIndex.ok && /^image\//i.test(viaIndex.headers.get('content-type') || '')) {
      return { url: mirrored, note: 'favicon blocked, took the indexed copy' };
    }
    return { url: null, note: `favicon unavailable (${type || 'no response'})` };
  }

  const landed = first.url || `${baseUrl}/favicon.ico`;
  // A 32px favicon is no use as a logo, but the ladder it came from is.
  const stem = landed.replace(/-\d+x\d+(\.[a-z]+)$/i, '$1');
  if (stem === landed) return { url: landed, note: `no size ladder, kept ${landed}` };

  const ext = (stem.match(/\.[a-z]+$/i) || ['.png'])[0];
  const root = stem.slice(0, -ext.length);
  for (const size of ['-512x512', '-270x270', '-192x192', '-180x180', '']) {
    const candidate = `${root}${size}${ext}`;
    const probe = await get(candidate);
    if (probe && probe.ok && /^image\//i.test(probe.headers.get('content-type') || '')) {
      return { url: candidate, note: `ladder hit ${size || 'base'}` };
    }
  }
  return { url: landed, note: 'ladder missed, kept the small one' };
}

// One attempt at the page. Throws with the evidence when what comes back is a
// refusal rather than a site.
async function fetchPage(url: string): Promise<string> {
  // The old User-Agent stopped mid-string, which reads as a bot to most
  // firewalls. Sites that serve us a challenge page instead of their content
  // are the main reason a scrape comes back with nothing in it.
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) ' +
        'Chrome/126.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-NZ,en;q=0.9',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
    },
    redirect: 'follow',
  });

  const html = await response.text();

  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status} (${html.length} bytes, server: ${response.headers.get('server') || '?'})`
    );
  }

  // A 200 carrying nothing is a refusal wearing a success code. Saying so
  // beats handing back a result with every field empty, which reads as "this
  // site has no logo" when it means "we never saw the site".
  if (html.trim().length < 500) {
    // Carry the evidence. "Empty page" alone cannot tell a bot challenge from a
    // JS shell from a genuinely bare site, and those need different answers.
    const snippet = html.replace(/\s+/g, ' ').trim().slice(0, 220);
    throw new Error(
      `empty page (${html.length} bytes, server: ${response.headers.get('server') || '?'}, ` +
        `cf-mitigated: ${response.headers.get('cf-mitigated') || 'no'}) — ${snippet}`
    );
  }

  return html;
}

// A page can answer 200 and still be empty of words: Wix, Squarespace and
// anything React-shaped ship a shell and draw the site with JavaScript. Counting
// the visible text is the cheapest way to tell that apart from a real page,
// because a shell has almost none of it however much markup it carries.
function looksUnrendered(html: string): boolean {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length < 400;
}

// Cloudflare Browser Rendering: real Chrome, run by them, returning the DOM
// after the JavaScript has had its turn. Costs a round trip and a little money,
// so it is the third thing we try rather than the first. Returns null whenever
// it is not configured, which keeps every existing deployment on the old path.
async function renderViaBrowser(
  url: string,
  env?: ScrapeEnv
): Promise<{ html: string | null; why: string }> {
  const account = env?.CF_ACCOUNT_ID;
  const token = env?.CF_BROWSER_TOKEN;
  if (!account || !token) return { html: null, why: 'no renderer configured' };

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${account}/browser-rendering/content`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          // Images are the slowest part of a page and we only want its words and
          // its markup — the image URLs survive in the HTML either way.
          rejectResourceTypes: ['image', 'media', 'font'],
          // networkidle0 waits for zero in-flight requests, which never
          // happens on a site that polls or holds a socket open — it timed out
          // every time. networkidle2 tolerates a couple of stragglers, which is
          // what "the page has finished drawing" actually looks like.
          gotoOptions: { waitUntil: 'networkidle2', timeout: 15000 },
        }),
      }
    );

    const raw = await response.text();
    if (!response.ok) {
      // Say which way it failed. Swallowing this silently is what made a bad
      // token look identical to a missing one.
      console.error('Browser render HTTP', response.status, raw.slice(0, 300));
      return { html: null, why: `renderer said ${response.status}: ${raw.slice(0, 120)}` };
    }

    let body: any = null;
    try { body = JSON.parse(raw); } catch { /* fall through */ }
    // The content endpoint has been seen returning both a JSON envelope and
    // bare HTML, so take whichever arrived.
    const html =
      typeof body?.result === 'string' ? body.result
      : typeof body?.result?.html === 'string' ? body.result.html
      : raw.trim().startsWith('<') ? raw
      : null;

    if (!html) {
      console.error('Browser render: no html in response', raw.slice(0, 300));
      return { html: null, why: 'renderer returned no html' };
    }
    if (html.trim().length < 500) return { html: null, why: 'renderer returned an empty page' };
    return { html, why: 'rendered in a browser' };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error('Browser render threw:', detail);
    return { html: null, why: `renderer failed: ${detail}` };
  }
}

/** The page, by whatever means works: two plain attempts, then a real browser. */
async function pageHtml(url: string, env?: ScrapeEnv): Promise<{ html: string; note?: string }> {
  // Hosts like SiteGround challenge by source address, and a Worker does not
  // always leave from the same one. The same request a moment later often lands
  // on an address they have no quarrel with, so one refusal is not an answer.
  // Two attempts, no more — their server is not ours to lean on.
  let plain: string | null = null;
  let refusal: unknown = null;
  try {
    plain = await fetchPage(url);
  } catch (firstTry) {
    refusal = firstTry;
    await new Promise((resolve) => setTimeout(resolve, 400));
    try {
      plain = await fetchPage(url);
    } catch {
      // keep the first refusal — it carries the better evidence
    }
  }

  if (plain && !looksUnrendered(plain)) return { html: plain };

  // Either nothing came back, or what came back has no words in it. Both are
  // cases a browser can answer and a fetch cannot.
  const rendered = await renderViaBrowser(url, env);
  if (rendered.html) {
    return {
      html: rendered.html,
      note: plain ? 'JS shell, rendered in a browser' : 'unreadable by fetch, rendered in a browser',
    };
  }

  // No usable render. A thin page still beats no page — but say why the
  // browser did not save us, so a bad token is distinguishable from no token.
  if (plain) return { html: plain, note: `thin page, ${rendered.why}` };
  throw refusal || new Error(`unreadable, ${rendered.why}`);
}

export async function scrapeWebsite(url: string, env?: ScrapeEnv): Promise<ScrapedData> {
  const page = await pageHtml(url, env);
  const html = page.html;

  const baseUrl = new URL(url).origin;

  // How the site dresses, not just what it owns. Mechanical and free here;
  // the one model call that reads it happens in the handler.
  const themeEvidence = await collectThemeEvidence(html, baseUrl);

  // Extract all data
  const title = extractTitle(html);
  const description = extractDescription(html);
  const tagline = extractTagline(html);
  const phone = extractPhone(html);
  const email = extractEmail(html);
  const address = extractAddress(html);
  const logoUrl = extractLogo(html, baseUrl);
  const faviconUrl = extractFavicon(html, baseUrl);
  const heroImage = extractHeroImage(html, baseUrl);
  const galleryImages = extractGalleryImages(html, baseUrl);
  const candidateImages = extractCandidateImages(html, baseUrl);
  const aboutText = extractAboutText(html);

  // Detect industry FIRST (before extracting services)
  const fullText = `${title} ${description} ${tagline} ${aboutText}`.toLowerCase();
  const industry = detectIndustry(fullText, html);

  // Extract services with industry context
  const services = extractServices(html, industry);
  const businessType = getBusinessType(industry);
  const socials = extractSocials(html);
  const hours = extractHours(html);
  const brandColour = extractBrandColour(html);

  return {
    url,
    title,
    description,
    tagline,
    phone,
    email,
    address,
    services,
    aboutText,
    heroImage,
    galleryImages,
    logoUrl,
    faviconUrl,
    industry,
    businessType,
    socials,
    hours,
    brandColour,
    candidateImages,
    vision: null,
    mediaConfidence: null,
    blocked: false,
    blockedReason: '',
    logoNeedsDark: false,
    themeEvidence,
    renderNote: page.note,
  };
}

// Their social accounts, so the new site still points where their audience is
function extractSocials(html: string): Record<string, string> {
  const networks: [string, RegExp][] = [
    ['facebook', /https?:\/\/(?:www\.)?facebook\.com\/[A-Za-z0-9._\-/]+/i],
    ['instagram', /https?:\/\/(?:www\.)?instagram\.com\/[A-Za-z0-9._\-/]+/i],
    ['linkedin', /https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in)\/[A-Za-z0-9._\-/]+/i],
    ['youtube', /https?:\/\/(?:www\.)?youtube\.com\/(?:@|c\/|channel\/|user\/)[A-Za-z0-9._\-/]+/i],
    ['tiktok', /https?:\/\/(?:www\.)?tiktok\.com\/@[A-Za-z0-9._\-]+/i],
  ];

  const found: Record<string, string> = {};
  for (const [name, pattern] of networks) {
    const match = html.match(pattern);
    if (!match) continue;
    const link = match[0].replace(/["'<>\\]+$/, '').replace(/\/(sharer|share|plugins)\b.*$/i, '');
    // Share buttons point at the network's own pages, not theirs
    if (/\b(sharer|share\.php|intent)\b/i.test(link)) continue;
    found[name] = link;
  }
  return found;
}

const DAY_WORDS = '(mon|tues?|wed(nes)?|thur?s?|fri|sat(ur)?|sun)(day)?';

// Opening hours, if they publish them in a form we can recognise
function extractHours(html: string): [string, string][] {
  const text = cleanText(html.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' '));
  const pattern = new RegExp(
    DAY_WORDS + '(?:\\s*(?:-|–|—|to)\\s*' + DAY_WORDS + ')?' +
    '\\s*:?\\s*' +
    '(closed|(?:\\d{1,2}(?::\\d{2})?\\s*(?:am|pm)?\\s*(?:-|–|—|to)\\s*\\d{1,2}(?::\\d{2})?\\s*(?:am|pm)))',
    'gi'
  );

  const rows: [string, string][] = [];
  const seen = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) && rows.length < 5) {
    const whole = match[0];
    const time = match[match.length - 1];
    const days = whole.slice(0, whole.length - time.length).replace(/[:\s]+$/, '').trim();
    const key = days.toLowerCase();
    if (!days || seen.has(key)) continue;
    seen.add(key);
    rows.push([titleCaseWords(days), titleCaseWords(time)]);
  }
  return rows;
}

function titleCaseWords(value: string): string {
  return value.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase()).replace(/\b(Am|Pm)\b/g, (m) => m.toLowerCase());
}

// Their actual brand colour beats our industry guess
function extractBrandColour(html: string): string | null {
  const theme = html.match(/<meta[^>]+name=["']theme-color["'][^>]+content=["']([^"']+)["']/i);
  const candidates: string[] = [];
  if (theme) candidates.push(theme[1].trim());

  // Otherwise the hex that appears most often in the markup
  const counts = new Map<string, number>();
  const hexes = html.match(/#[0-9a-fA-F]{6}\b/g) || [];
  for (const raw of hexes) {
    const hex = raw.toLowerCase();
    counts.set(hex, (counts.get(hex) || 0) + 1);
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([hex]) => hex);
  candidates.push(...ranked.slice(0, 12));

  for (const candidate of candidates) {
    if (!/^#[0-9a-fA-F]{6}$/.test(candidate)) continue;
    const r = parseInt(candidate.slice(1, 3), 16);
    const g = parseInt(candidate.slice(3, 5), 16);
    const b = parseInt(candidate.slice(5, 7), 16);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const lightness = (max + min) / 2 / 255;
    const saturation = max === min ? 0 : (max - min) / (255 - Math.abs(max + min - 255));
    // Skip greys, near-whites and near-blacks: they are page furniture, not brand
    if (saturation < 0.3 || lightness < 0.12 || lightness > 0.82) continue;
    return candidate;
  }
  return null;
}

function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (match) {
    // Remove site name suffix (often after | or -)
    return cleanText(match[1].split(/\s*[|\-–—]\s*/)[0]);
  }
  return '';
}

function extractDescription(html: string): string {
  const patterns = [
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i,
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      return cleanText(match[1]);
    }
  }
  return '';
}

function extractTagline(html: string): string {
  // Look for the main H1 - usually the tagline
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (h1Match) {
    const text = cleanText(h1Match[1]);
    // Valid tagline: 10-150 chars, not just a business name
    if (text.length > 10 && text.length < 150) {
      return text;
    }
  }

  // Look for hero section heading
  const heroPatterns = [
    /class=["'][^"']*hero[^"']*["'][\s\S]{0,500}<h[12][^>]*>([^<]+)/i,
    /class=["'][^"']*banner[^"']*["'][\s\S]{0,500}<h[12][^>]*>([^<]+)/i,
    /class=["'][^"']*masthead[^"']*["'][\s\S]{0,500}<h[12][^>]*>([^<]+)/i,
  ];

  for (const pattern of heroPatterns) {
    const match = html.match(pattern);
    if (match) {
      const text = cleanText(match[1]);
      if (text.length > 10 && text.length < 150) {
        return text;
      }
    }
  }

  return '';
}

function extractPhone(html: string): string {
  // First try tel: links
  const telMatch = html.match(/href=["']tel:([^"']+)["']/i);
  if (telMatch) {
    return cleanPhone(telMatch[1]);
  }

  // Try phone patterns
  const patterns = [
    /(0800[\s\-]?[\d\s\-]{5,10})/i,  // NZ Freephone
    /(\+64[\s\-]?[\d\s\-]{8,12})/,    // NZ International
    /(0[234679][\s\-]?[\d\s\-]{7,10})/,  // NZ local
    /(?:phone|tel|call)[:\s]+([0-9\s\-\(\)]{8,20})/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      return cleanPhone(match[1]);
    }
  }

  return '';
}

function cleanPhone(phone: string): string {
  return phone.replace(/[^\d\s\-\+\(\)]/g, '').trim();
}

// The bare-text fallback will happily return the first thing on the page shaped
// like an address, and on a Wix site that is a Sentry error-reporting key —
// 605a7ba...@sentry-next.wixpress.com went out as a rugby club's contact email.
// A tracking address published as somebody's own is worse than no email.
const NOT_A_PERSON =
  /@(sentry|sentry-next|sentry\.io|wixpress|wix\.com|example|test|localhost|domain|email|yourdomain|sentry-cdn)/i;

function usableEmail(value: string): string {
  const email = String(value || '').trim();
  if (!email || email.length > 120) return '';
  if (NOT_A_PERSON.test(email)) return '';
  // A 32-character hex local part is a machine, not a person.
  if (/^[0-9a-f]{24,}@/i.test(email)) return '';
  return email;
}

function extractEmail(html: string): string {
  const mailtoMatch = html.match(/href=["']mailto:([^"'?]+)/i);
  if (mailtoMatch) {
    const clean = usableEmail(mailtoMatch[1]);
    if (clean) return clean;
  }

  // Every candidate, not just the first — the first is frequently a tracker.
  const all = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
  for (const candidate of all) {
    const clean = usableEmail(candidate);
    if (clean) return clean;
  }
  return '';
}

function extractAddress(html: string): string {
  // Try schema.org
  const schemaMatch = html.match(/"streetAddress":\s*"([^"]+)"/);
  if (schemaMatch) return schemaMatch[1];

  // Try address element
  const addressMatch = html.match(/<address[^>]*>([\s\S]*?)<\/address>/i);
  if (addressMatch) {
    const text = cleanText(addressMatch[1].replace(/<[^>]+>/g, ' '));
    if (text.length > 10 && text.length < 200) {
      return text;
    }
  }

  // Try NZ address pattern
  const nzMatch = html.match(/\d+\s+[A-Za-z\s]+(?:Street|Road|Avenue|Drive|Place|Way)[,\s]+[A-Za-z\s]+/i);
  if (nzMatch) return cleanText(nzMatch[0]);

  return '';
}

function extractLogo(html: string, baseUrl: string): string | null {
  const patterns = [
    /<img[^>]+class=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["']/i,
    /<img[^>]+src=["']([^"']+)["'][^>]*class=["'][^"']*logo[^"']*["']/i,
    /<a[^>]+class=["'][^"']*logo[^"']*["'][^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)["']/i,
    /<img[^>]+src=["']([^"']*logo[^"']+)["']/i,
    // Some builders label the logo in an attribute of their own invention —
    // Squarespace uses elementtiming — so accept "logo" anywhere in the tag.
    /<img[^>]*\blogo\b[^>]*\ssrc=["']([^"']+)["']/i,
    /<img[^>]+src=["']([^"']+)["'][^>]*\blogo\b[^>]*>/i,
    /<header[\s\S]{0,500}<img[^>]+src=["']([^"']+)["']/i,
    // Last resort: the icon a phone uses for the home screen is nearly always
    // the business's mark, cropped square.
    /<link[^>]+rel=["'][^"']*apple-touch-icon[^"']*["'][^>]*href=["']([^"']+)["']/i,
    /<link[^>]+href=["']([^"']+)["'][^>]*rel=["'][^"']*apple-touch-icon[^"']*["']/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const logoUrl = resolveUrl(match[1], baseUrl);
      if (logoUrl && isValidImageUrl(logoUrl)) {
        return logoUrl;
      }
    }
  }

  return null;
}

function extractFavicon(html: string, baseUrl: string): string | null {
  const match = html.match(/<link[^>]+rel=["'](?:shortcut\s+)?icon["'][^>]+href=["']([^"']+)["']/i);
  return match ? resolveUrl(match[1], baseUrl) : `${baseUrl}/favicon.ico`;
}

function extractHeroImage(html: string, baseUrl: string): string | null {
  // Look for hero/banner images
  const patterns = [
    // Background images in hero sections
    /class=["'][^"']*(?:hero|banner|masthead)[^"']*["'][^>]*style=["'][^"']*background[^:]*:\s*url\(["']?([^"'\)]+)/i,
    // Images in hero sections
    /class=["'][^"']*(?:hero|banner|masthead)[^"']*["'][\s\S]{0,1000}<img[^>]+src=["']([^"']+)["']/i,
    // First large image
    /<img[^>]+(?:width|height)=["']?(?:[5-9]\d{2}|\d{4,})["']?[^>]+src=["']([^"']+)["']/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const imageUrl = resolveUrl(match[1], baseUrl);
      if (imageUrl && isValidImageUrl(imageUrl) && !isIconOrLogo(imageUrl)) {
        return imageUrl;
      }
    }
  }

  return null;
}

// Builders serve a tiny blurred placeholder through a transform path and swap the
// real file in with JS, so the markup is full of 77px blurs. Judging one of those
// means marking a photo down for being a thumbnail.
//
// Asking for the untransformed original is the obvious fix and the wrong one — on
// this test site it is a 13.5MB camera file, which would land in a gallery and
// never load. Rebuilding the transform at a sane width gets a real photograph at
// ~430KB, and every size variant of one photo converges on the same URL, so they
// stop eating candidate slots as well.
const DISPLAY_TRANSFORM = 'v1/fit/w_1600,h_1600,al_c,q_85';

function displayImage(url: string): string {
  const parts = url.split('/v1/');
  if (parts.length < 2) return url;
  const base = parts[0];
  if (!/\.(jpe?g|png|webp|gif|avif)$/i.test(base.split('?')[0])) return url;
  const name = base.split('/').pop();
  if (!name) return url;
  return `${base}/${DISPLAY_TRANSFORM}/${name}`;
}

// Everything plausible, in document order, with no opinion about what it is.
// The old path applied a filename blocklist here — which threw away a hero shot
// exported as banner-icon.jpg and kept junk called photo-1.png. Judging happens
// in the vision pass now, where something is actually looking.
function extractCandidateImages(html: string, baseUrl: string): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();
  const add = (raw: string | null | undefined) => {
    if (!raw || urls.length >= 12) return;
    const resolved = resolveUrl(raw, baseUrl);
    if (!resolved) return;
    const full = displayImage(resolved);
    if (seen.has(full) || !isValidImageUrl(full)) return;
    seen.add(full);
    urls.push(full);
  };

  // The social preview is usually their single best photograph.
  const og = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  if (og) add(og[1]);

  let match: RegExpExecArray | null;
  const imgPattern = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  while ((match = imgPattern.exec(html)) !== null && urls.length < 12) add(match[1]);

  // Lazy-loading builders park a placeholder in src and the real file in data-src,
  // so a src-only sweep comes back with a page full of blank spacers.
  const lazyPattern = /<img[^>]+data-src=["']([^"']+)["']/gi;
  while ((match = lazyPattern.exec(html)) !== null && urls.length < 12) add(match[1]);

  return urls;
}

function extractGalleryImages(html: string, baseUrl: string): string[] {
  const images: string[] = [];
  const seen = new Set<string>();

  // Find all images
  const imgPattern = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match;

  while ((match = imgPattern.exec(html)) !== null) {
    const src = match[1];
    const fullUrl = resolveUrl(src, baseUrl);

    if (!fullUrl || seen.has(fullUrl)) continue;
    if (!isValidImageUrl(fullUrl)) continue;
    if (isIconOrLogo(src)) continue;

    // Check for size hints - skip small images
    const widthMatch = match[0].match(/width=["']?(\d+)/i);
    const heightMatch = match[0].match(/height=["']?(\d+)/i);

    if (widthMatch && parseInt(widthMatch[1]) < 150) continue;
    if (heightMatch && parseInt(heightMatch[1]) < 150) continue;

    seen.add(fullUrl);
    images.push(fullUrl);

    if (images.length >= 8) break;
  }

  return images;
}

function isIconOrLogo(url: string): boolean {
  const lower = url.toLowerCase();
  return /logo|icon|favicon|sprite|badge|button|arrow|chevron/i.test(lower);
}

function extractServices(html: string, industry: string): string[] {
  const services: string[] = [];
  const seen = new Set<string>();

  // Industry-specific service patterns
  const industryServices: Record<string, RegExp[]> = {
    medical: [
      /(aged care|maternity|palliative|respite|end of life|primary care|surgical|orthopaedic|physiotherapy|radiology|pharmacy)/gi,
      /(outpatient|inpatient|emergency|rehabilitation|mental health|specialist)/gi,
    ],
    dental: [
      /(cleaning|whitening|filling|extraction|crown|bridge|implant|orthodontic|root canal)/gi,
    ],
    plumbing: [
      /(drain|leak|pipe|tap|toilet|shower|hot water|gas fitting|blocked)/gi,
    ],
    construction: [
      /(new build|renovation|extension|kitchen|bathroom|deck|fence|concrete|roofing)/gi,
    ],
    legal: [
      /(family law|property law|criminal|civil|commercial|litigation|wills|trusts|conveyancing)/gi,
    ],
  };

  // First try industry-specific patterns
  const patterns = industryServices[industry] || [];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const text = cleanText(match[1]);
      const lower = text.toLowerCase();
      if (!seen.has(lower) && text.length > 3) {
        seen.add(lower);
        services.push(capitalizeWords(text));
      }
    }
  }

  // If not enough, look for service lists
  if (services.length < 4) {
    // Look for "services" section lists
    const servicesSection = html.match(/(?:our services|what we (?:do|offer)|services)[\s\S]{0,200}<ul[^>]*>([\s\S]*?)<\/ul>/i);
    if (servicesSection) {
      const liPattern = /<li[^>]*>(?:<[^>]+>)*([^<]+)/gi;
      let liMatch;
      while ((liMatch = liPattern.exec(servicesSection[1])) !== null) {
        const text = cleanText(liMatch[1]);
        const lower = text.toLowerCase();
        if (!seen.has(lower) && isValidService(text)) {
          seen.add(lower);
          services.push(text);
        }
      }
    }

    // Look for service cards (h3/h4 in service divs)
    const cardPattern = /class=["'][^"']*service[^"']*["'][^>]*>[\s\S]{0,200}<h[34][^>]*>([^<]+)/gi;
    let cardMatch;
    while ((cardMatch = cardPattern.exec(html)) !== null) {
      const text = cleanText(cardMatch[1]);
      const lower = text.toLowerCase();
      if (!seen.has(lower) && isValidService(text)) {
        seen.add(lower);
        services.push(text);
      }
    }
  }

  return services.slice(0, 8);
}

function isValidService(text: string): boolean {
  if (text.length < 4 || text.length > 60) return false;

  const lower = text.toLowerCase();

  // Skip navigation items
  const skipWords = [
    'home', 'about', 'contact', 'blog', 'news', 'faq', 'login', 'sign',
    'cart', 'menu', 'read more', 'learn more', 'click here', 'our team',
    'our story', 'meet the', 'view all', 'see all', 'copyright', 'privacy',
    'terms', 'sitemap', 'subscribe', 'follow us',
  ];

  if (skipWords.some(w => lower.includes(w))) return false;

  // Skip if mostly punctuation or numbers
  if (/^[\d\s\-\.\,]+$/.test(text)) return false;

  return true;
}

function capitalizeWords(text: string): string {
  return text.split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function extractAboutText(html: string): string {
  // Look for about section
  const patterns = [
    /(?:id|class)=["'][^"']*about[^"']*["'][\s\S]{0,500}<p[^>]*>([\s\S]*?)<\/p>/i,
    /about us[\s\S]{0,500}<p[^>]*>([\s\S]*?)<\/p>/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      const text = cleanText(match[1].replace(/<[^>]+>/g, ' '));
      if (text.length > 50 && text.length < 1000) {
        return text;
      }
    }
  }

  // Try to find a descriptive paragraph
  const pMatches = html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi);
  for (const match of pMatches) {
    const text = cleanText(match[1].replace(/<[^>]+>/g, ' '));
    if (text.length > 80 && text.length < 500) {
      // Look for about-like content
      const lower = text.toLowerCase();
      if (
        lower.includes('we are') || lower.includes('our ') ||
        lower.includes('dedicated') || lower.includes('committed') ||
        lower.includes('experience') || lower.includes('established')
      ) {
        return text;
      }
    }
  }

  return '';
}

function detectIndustry(text: string, html: string): string {
  const fullText = (text + ' ' + html).toLowerCase();
  const scores: Record<string, number> = {};

  for (const [industry, groups] of Object.entries(INDUSTRY_KEYWORDS)) {
    scores[industry] = 0;
    for (const group of groups) {
      for (const keyword of group.keywords) {
        const regex = new RegExp(keyword, 'gi');
        const matches = fullText.match(regex);
        if (matches) {
          scores[industry] += matches.length * group.weight;
        }
      }
    }
  }

  // Find highest scoring industry
  let maxScore = 0;
  let detectedIndustry = 'default';

  for (const [industry, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      detectedIndustry = industry;
    }
  }

  // Require minimum confidence
  return maxScore >= 5 ? detectedIndustry : 'default';
}

function getBusinessType(industry: string): string {
  const types: Record<string, string> = {
    medical: 'Healthcare Provider',
    dental: 'Dental Practice',
    restaurant: 'Restaurant & Dining',
    construction: 'Construction & Building',
    plumbing: 'Plumbing Services',
    electrical: 'Electrical Services',
    landscaping: 'Landscaping',
    legal: 'Legal Services',
    accounting: 'Accounting & Finance',
    realestate: 'Real Estate',
    fitness: 'Fitness & Wellness',
    salon: 'Beauty & Personal Care',
    automotive: 'Automotive Services',
    photography: 'Photography',
    tech: 'Technology Services',
    veterinary: 'Veterinary Care',
    default: 'Professional Services',
  };

  return types[industry] || types.default;
}

function resolveUrl(url: string, baseUrl: string): string | null {
  if (!url) return null;
  if (url.startsWith('data:')) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('//')) return 'https:' + url;
  if (url.startsWith('/')) return baseUrl + url;
  return baseUrl + '/' + url;
}

function isValidImageUrl(url: string): boolean {
  if (!url) return false;
  if (url.startsWith('data:image')) return true;
  // Logos are very often SVG. Leaving it out meant a real logo was thrown away
  // unless its URL happened to contain /uploads/ or /image.
  return /\.(jpg|jpeg|png|webp|gif|svg|avif)(\?.*)?$/i.test(url) ||
         url.includes('/image') ||
         url.includes('/uploads/');
}

function cleanText(text: string): string {
  return text
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
