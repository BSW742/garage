import type { APIRoute } from 'astro';

export const prerender = false;

interface ScrapedData {
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

export const POST: APIRoute = async ({ request }) => {
  try {
    const { url } = await request.json();

    if (!url) {
      return new Response(JSON.stringify({ error: 'URL required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const scraped = await scrapeWebsite(url);

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

async function scrapeWebsite(url: string): Promise<ScrapedData> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const html = await response.text();
  const baseUrl = new URL(url).origin;

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
  const aboutText = extractAboutText(html);

  // Detect industry FIRST (before extracting services)
  const fullText = `${title} ${description} ${tagline} ${aboutText}`.toLowerCase();
  const industry = detectIndustry(fullText, html);

  // Extract services with industry context
  const services = extractServices(html, industry);
  const businessType = getBusinessType(industry);

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
  };
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

function extractEmail(html: string): string {
  const mailtoMatch = html.match(/href=["']mailto:([^"'?]+)/i);
  if (mailtoMatch) {
    return mailtoMatch[1];
  }

  const emailMatch = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return emailMatch ? emailMatch[0] : '';
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
    /<header[\s\S]{0,500}<img[^>]+src=["']([^"']+)["']/i,
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
  return /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(url) ||
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
