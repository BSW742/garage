import type { APIRoute } from 'astro';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { generateMinimalTemplate } from '../../templates/minimal';
import { generateBoldTemplate } from '../../templates/bold';
import { generateClassicTemplate } from '../../templates/classic';

export const prerender = false;

interface Refinements {
  serviceImages?: boolean;
  serviceDescriptions?: boolean;
  showGallery?: boolean;
  darkModeToggle?: boolean;
  notes?: string;
}

interface GenerateRequest {
  projectId: string;
  url: string;
  business: string;
  slug: string;
  template?: 'minimal' | 'bold' | 'classic';
  refinements?: Refinements;
  // Pre-scraped data (optional - will scrape if not provided)
  scraped?: {
    tagline: string;
    description: string;
    services: string[];
    aboutText: string;
    phone: string;
    email: string;
    address: string;
    industry: string | null;
    logoUrl: string | null;
    heroImage: string | null;
    galleryImages: string[];
    businessType: string;
  };
  // Pre-analyzed data (optional)
  analysis?: {
    logoBase64: string | null;
    palette: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      backgroundAlt: string;
      text: string;
      textMuted: string;
    };
    suggestedTemplate: 'minimal' | 'bold' | 'classic';
  };
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body: GenerateRequest = await request.json();
    const { url, business, slug, template } = body;

    if (!url || !business || !slug) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get scraped data - either from request or fetch fresh
    let scraped = body.scraped;
    if (!scraped) {
      try {
        const scrapeRes = await fetch(new URL('/api/scrape', request.url).toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });
        if (scrapeRes.ok) {
          scraped = await scrapeRes.json();
        }
      } catch (e) {
        console.log('Scrape failed, using defaults');
      }
    }

    // Provide defaults if scraping failed
    if (!scraped) {
      scraped = {
        tagline: business,
        description: '',
        services: [],
        aboutText: '',
        phone: '',
        email: '',
        address: '',
        industry: null,
        logoUrl: null,
        heroImage: null,
        galleryImages: [],
        businessType: 'Professional Services'
      };
    }

    // Get analysis data - either from request or fetch fresh
    let analysis = body.analysis;
    if (!analysis) {
      try {
        const analyzeRes = await fetch(new URL('/api/analyze', request.url).toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            logoUrl: scraped.logoUrl,
            industry: scraped.industry
          })
        });
        if (analyzeRes.ok) {
          analysis = await analyzeRes.json();
        }
      } catch (e) {
        console.log('Analysis failed, using defaults');
      }
    }

    // Provide defaults if analysis failed
    if (!analysis) {
      analysis = {
        logoBase64: null,
        palette: {
          primary: '#2563eb',
          secondary: '#1e3a5f',
          accent: '#f59e0b',
          background: '#ffffff',
          backgroundAlt: '#f8fafc',
          text: '#1a1a1a',
          textMuted: '#666666'
        },
        suggestedTemplate: 'minimal'
      };
    }

    // Determine which template to use
    const selectedTemplate = template || analysis.suggestedTemplate || 'minimal';

    // Default refinements
    const refinements: Refinements = {
      serviceImages: true,
      serviceDescriptions: true,
      showGallery: true,
      darkModeToggle: true,
      notes: '',
      ...body.refinements
    };

    // Build template data
    const templateData = {
      business,
      tagline: scraped.tagline || business,
      description: scraped.description || '',
      services: scraped.services || [],
      aboutText: scraped.aboutText || '',
      phone: scraped.phone || '',
      email: scraped.email || '',
      address: scraped.address || '',
      logoBase64: analysis.logoBase64,
      originalUrl: url,
      palette: analysis.palette,
      heroImage: scraped.heroImage || null,
      galleryImages: refinements.showGallery ? (scraped.galleryImages || []) : [],
      industry: scraped.industry || 'default',
      businessType: scraped.businessType || 'Professional Services',
      refinements
    };

    // Generate the page content
    let generatedPage: string;
    switch (selectedTemplate) {
      case 'bold':
        generatedPage = generateBoldTemplate(templateData);
        break;
      case 'classic':
        generatedPage = generateClassicTemplate(templateData);
        break;
      case 'minimal':
      default:
        generatedPage = generateMinimalTemplate(templateData);
        break;
    }

    // Write the file
    const sitesDir = path.join(process.cwd(), 'src', 'pages', 'sites');
    if (!fs.existsSync(sitesDir)) {
      fs.mkdirSync(sitesDir, { recursive: true });
    }

    const filePath = path.join(sitesDir, `${slug}.astro`);
    fs.writeFileSync(filePath, generatedPage);

    return new Response(JSON.stringify({
      success: true,
      path: `/sites/${slug}`,
      template: selectedTemplate,
      hasLogo: !!analysis.logoBase64,
      paletteSource: analysis.palette.source || 'unknown',
      message: 'Site generated successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Generation error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to generate site',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
