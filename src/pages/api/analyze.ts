import type { APIRoute } from 'astro';

export const prerender = false;

interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  backgroundAlt: string;
  text: string;
  textMuted: string;
  success: string;
  source: 'extracted' | 'fallback' | 'industry';
}

interface AnalysisResult {
  logoUrl: string | null;
  logoBase64: string | null;
  palette: ColorPalette;
  dominantColors: string[];
  suggestedTemplate: 'minimal' | 'bold' | 'classic';
}

// Industry-specific color palettes
const INDUSTRY_PALETTES: Record<string, Omit<ColorPalette, 'source'>> = {
  restaurant: {
    primary: '#c41e3a',
    secondary: '#2c1810',
    accent: '#d4a574',
    background: '#faf8f5',
    backgroundAlt: '#f0ebe4',
    text: '#1a1a1a',
    textMuted: '#666666',
    success: '#2d5a27',
  },
  construction: {
    primary: '#f7931e',
    secondary: '#2c3e50',
    accent: '#e74c3c',
    background: '#ffffff',
    backgroundAlt: '#f5f5f5',
    text: '#1a1a1a',
    textMuted: '#666666',
    success: '#27ae60',
  },
  plumbing: {
    primary: '#2980b9',
    secondary: '#1a3a52',
    accent: '#3498db',
    background: '#ffffff',
    backgroundAlt: '#f0f7fc',
    text: '#1a1a1a',
    textMuted: '#666666',
    success: '#27ae60',
  },
  electrical: {
    primary: '#f1c40f',
    secondary: '#2c3e50',
    accent: '#e67e22',
    background: '#ffffff',
    backgroundAlt: '#fffdf5',
    text: '#1a1a1a',
    textMuted: '#666666',
    success: '#27ae60',
  },
  landscaping: {
    primary: '#27ae60',
    secondary: '#1e3a2f',
    accent: '#8bc34a',
    background: '#ffffff',
    backgroundAlt: '#f5faf5',
    text: '#1a1a1a',
    textMuted: '#666666',
    success: '#2ecc71',
  },
  dental: {
    primary: '#00b4d8',
    secondary: '#0077b6',
    accent: '#90e0ef',
    background: '#ffffff',
    backgroundAlt: '#f0faff',
    text: '#1a1a1a',
    textMuted: '#666666',
    success: '#06d6a0',
  },
  medical: {
    primary: '#0077b6',
    secondary: '#023e8a',
    accent: '#48cae4',
    background: '#ffffff',
    backgroundAlt: '#f0f8ff',
    text: '#1a1a1a',
    textMuted: '#666666',
    success: '#06d6a0',
  },
  legal: {
    primary: '#1a365d',
    secondary: '#0d1b2a',
    accent: '#c9a227',
    background: '#ffffff',
    backgroundAlt: '#fafafa',
    text: '#1a1a1a',
    textMuted: '#666666',
    success: '#2d5a27',
  },
  accounting: {
    primary: '#1e3a5f',
    secondary: '#0f1c2e',
    accent: '#2ecc71',
    background: '#ffffff',
    backgroundAlt: '#f8fafc',
    text: '#1a1a1a',
    textMuted: '#666666',
    success: '#27ae60',
  },
  realestate: {
    primary: '#1a365d',
    secondary: '#2d3748',
    accent: '#c9a227',
    background: '#ffffff',
    backgroundAlt: '#fafafa',
    text: '#1a1a1a',
    textMuted: '#666666',
    success: '#27ae60',
  },
  fitness: {
    primary: '#e63946',
    secondary: '#1d3557',
    accent: '#f77f00',
    background: '#ffffff',
    backgroundAlt: '#f8f8f8',
    text: '#1a1a1a',
    textMuted: '#666666',
    success: '#06d6a0',
  },
  salon: {
    primary: '#9d4edd',
    secondary: '#240046',
    accent: '#ff6b9d',
    background: '#ffffff',
    backgroundAlt: '#fdf8ff',
    text: '#1a1a1a',
    textMuted: '#666666',
    success: '#06d6a0',
  },
  photography: {
    primary: '#1a1a1a',
    secondary: '#333333',
    accent: '#c9a227',
    background: '#ffffff',
    backgroundAlt: '#f5f5f5',
    text: '#1a1a1a',
    textMuted: '#666666',
    success: '#27ae60',
  },
  tech: {
    primary: '#6366f1',
    secondary: '#1e1b4b',
    accent: '#22d3ee',
    background: '#ffffff',
    backgroundAlt: '#f8fafc',
    text: '#1a1a1a',
    textMuted: '#666666',
    success: '#10b981',
  },
  default: {
    primary: '#2563eb',
    secondary: '#1e3a5f',
    accent: '#f59e0b',
    background: '#ffffff',
    backgroundAlt: '#f8fafc',
    text: '#1a1a1a',
    textMuted: '#666666',
    success: '#10b981',
  },
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const { logoUrl, industry } = await request.json();

    const result: AnalysisResult = {
      logoUrl: logoUrl || null,
      logoBase64: null,
      palette: { ...INDUSTRY_PALETTES.default, source: 'fallback' },
      dominantColors: [],
      suggestedTemplate: 'minimal',
    };

    // Try to download and analyze the logo
    if (logoUrl) {
      try {
        const logoResponse = await fetch(logoUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
            'Accept': 'image/*',
          },
        });

        if (logoResponse.ok) {
          const contentType = logoResponse.headers.get('content-type') || '';
          const buffer = await logoResponse.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');

          // Only store if it's actually an image
          if (contentType.includes('image') || logoUrl.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i)) {
            const mimeType = contentType.includes('image') ? contentType : 'image/png';
            result.logoBase64 = `data:${mimeType};base64,${base64}`;

            // Extract colors from image (if not SVG)
            if (!contentType.includes('svg') && !logoUrl.endsWith('.svg')) {
              const colors = extractColorsFromBuffer(buffer);
              if (colors.length > 0) {
                result.dominantColors = colors;
                result.palette = buildPaletteFromColors(colors, industry);
              }
            }
          }
        }
      } catch (logoError) {
        console.log('Could not fetch logo:', logoError);
      }
    }

    // If no colors extracted, use industry palette
    if (result.dominantColors.length === 0 && industry) {
      const industryPalette = INDUSTRY_PALETTES[industry] || INDUSTRY_PALETTES.default;
      result.palette = { ...industryPalette, source: 'industry' };
    }

    // Suggest template based on industry
    result.suggestedTemplate = suggestTemplate(industry);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return new Response(JSON.stringify({
      error: 'Analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Simple color extraction from image buffer
function extractColorsFromBuffer(buffer: ArrayBuffer): string[] {
  // This is a simplified approach - in production you'd use sharp or canvas
  // For now, we'll analyze the raw bytes to find common color patterns

  const bytes = new Uint8Array(buffer);
  const colorCounts: Map<string, number> = new Map();

  // Skip header bytes and sample RGB values
  // This works best with uncompressed formats but gives rough results for others
  for (let i = 50; i < bytes.length - 3; i += 12) {
    const r = bytes[i];
    const g = bytes[i + 1];
    const b = bytes[i + 2];

    // Quantize to reduce color space
    const qr = Math.round(r / 32) * 32;
    const qg = Math.round(g / 32) * 32;
    const qb = Math.round(b / 32) * 32;

    // Skip near-white and near-black
    const brightness = (qr + qg + qb) / 3;
    if (brightness > 240 || brightness < 15) continue;

    const hex = rgbToHex(qr, qg, qb);
    colorCounts.set(hex, (colorCounts.get(hex) || 0) + 1);
  }

  // Sort by frequency and return top colors
  const sorted = [...colorCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([color]) => color);

  return sorted;
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.min(255, Math.max(0, x)).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  return (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
}

function buildPaletteFromColors(colors: string[], industry: string | null): ColorPalette {
  if (colors.length === 0) {
    return { ...INDUSTRY_PALETTES.default, source: 'fallback' };
  }

  // Check if extracted colors are too dull (grayscale/low saturation)
  const colorfulColors = colors.filter(isColorful);

  // If no colorful colors found, use industry palette instead
  if (colorfulColors.length === 0 && industry) {
    const industryPalette = INDUSTRY_PALETTES[industry] || INDUSTRY_PALETTES.default;
    return { ...industryPalette, source: 'industry' };
  }

  // Use colorful colors if available, otherwise fallback to original colors
  const usableColors = colorfulColors.length > 0 ? colorfulColors : colors;

  // Use first color as primary
  const primary = usableColors[0];
  const primaryLum = getLuminance(primary);

  // Find a contrasting secondary color
  let secondary = usableColors[1] || darkenColor(primary, 40);
  const secondaryLum = getLuminance(secondary);

  // If secondary is too similar, darken primary
  if (Math.abs(secondaryLum - primaryLum) < 0.2) {
    secondary = darkenColor(primary, 50);
  }

  // Accent is third color or a shifted version of primary
  const accent = usableColors[2] || shiftHue(primary, 30);

  // Determine if we need light or dark background based on primary
  const needsDarkBg = primaryLum > 0.6;

  return {
    primary,
    secondary,
    accent,
    background: needsDarkBg ? '#0a0a0a' : '#ffffff',
    backgroundAlt: needsDarkBg ? '#141414' : '#f8fafc',
    text: needsDarkBg ? '#ffffff' : '#1a1a1a',
    textMuted: needsDarkBg ? '#a0a0a0' : '#666666',
    success: '#10b981',
    source: 'extracted',
  };
}

// Check if a color has enough saturation to be considered "colorful"
function isColorful(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;

  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  // Calculate saturation
  let s = 0;
  if (max !== min) {
    s = l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
  }

  // Color is "colorful" if saturation > 0.15 and not too dark/light
  return s > 0.15 && l > 0.1 && l < 0.9;
}

function darkenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const factor = 1 - percent / 100;
  return rgbToHex(
    Math.round(rgb.r * factor),
    Math.round(rgb.g * factor),
    Math.round(rgb.b * factor)
  );
}

function shiftHue(hex: string, degrees: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  // Convert to HSL
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  // Shift hue
  h = (h + degrees / 360) % 1;
  if (h < 0) h += 1;

  // Convert back to RGB
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return rgbToHex(
    Math.round(hue2rgb(p, q, h + 1/3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1/3) * 255)
  );
}

function suggestTemplate(industry: string | null): 'minimal' | 'bold' | 'classic' {
  if (!industry) return 'minimal';

  const boldIndustries = ['fitness', 'construction', 'automotive', 'restaurant'];
  const classicIndustries = ['legal', 'accounting', 'medical', 'dental', 'realestate'];

  if (boldIndustries.includes(industry)) return 'bold';
  if (classicIndustries.includes(industry)) return 'classic';

  return 'minimal';
}
