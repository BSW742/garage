// Renders a site claimed at <slug>.garage.co.nz from the config the
// builder stored in D1. Mirrors the live preview in /build.

export interface SiteContact { phone?: string; email?: string; address?: string }
export interface SiteSection {
  type: string;
  label?: string;
  title?: string;
  text?: string;
  items?: [string, string][];
  tint?: string;
  images?: string[];
  rows?: [string, string][];
  quote?: string;
  who?: string;
}
export interface SiteConfig {
  name?: string;
  tone?: 'light' | 'warm' | 'dark';
  eyebrow?: string;
  headline?: string;
  lede?: string;
  cta?: string;
  palette?: { primary?: string; deep?: string; wash?: string };
  display?: string;
  body?: string;
  logo?: string | null;
  heroImage?: string | null;
  sections?: SiteSection[];
  contact?: SiteContact;
  images?: string[];
}

function esc(value: unknown): string {
  return String(value == null ? '' : value).replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string)
  );
}

// Only allow image/link URLs we are happy to embed
function safeUrl(url: unknown): string | null {
  const value = String(url || '').trim();
  if (!/^https?:\/\//i.test(value)) return null;
  return value.replace(/[()"'\s]/g, encodeURIComponent);
}

function initials(name: string): string {
  const parts = (name || '?').split(/\s+/).filter(Boolean);
  return ((parts[0] || '?')[0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}

const CSS = `
*{margin:0;padding:0;box-sizing:border-box}
:root{--primary:#2563eb;--deep:#1e40af;--wash:#f6f8fb;--ink:#101418;--soft:#5b6472;--line:#e7ebf0;
--display:'Poppins',system-ui,sans-serif;--body:'Inter',system-ui,-apple-system,sans-serif}
html{-webkit-font-smoothing:antialiased;scroll-behavior:smooth}
body{font-family:var(--body);color:var(--ink);line-height:1.6;background:var(--page,#fff)}
img{max-width:100%}
a{color:inherit;text-decoration:none}
.wrap{max-width:70rem;margin:0 auto}
nav.top{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:1.1rem 1.6rem;border-bottom:1px solid var(--line);flex-wrap:wrap}
.brand{display:flex;align-items:center;gap:.6rem;font-weight:700;font-size:1.05rem;letter-spacing:-.02em}
.brand img{height:34px;width:auto;max-width:170px;object-fit:contain}
.glyph{width:32px;height:32px;display:grid;place-items:center;border-radius:8px;background:var(--primary);color:#fff;font-size:.85rem;font-weight:700}
.links{display:flex;gap:1.3rem;font-size:.9rem;color:var(--soft)}
.top .cta{background:var(--primary);color:#fff;font-size:.85rem;font-weight:600;padding:.55rem 1.1rem;border-radius:999px}
header.hero{padding:5rem 1.6rem;text-align:center;background:radial-gradient(ellipse 70% 60% at 50% 0%,color-mix(in srgb,var(--primary) 14%,transparent) 0%,transparent 60%),var(--wash);position:relative;overflow:hidden}
header.hero.photo{color:#fff}
.hero-photo{position:absolute;inset:0;background-size:cover;background-position:center}
.hero-photo::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(6,10,16,.55),rgba(6,10,16,.75))}
.hero-inner{position:relative;z-index:1;max-width:46rem;margin:0 auto}
.eyebrow{font-size:.72rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--primary);margin-bottom:.9rem}
header.hero.photo .eyebrow{color:#fff;opacity:.85}
h1{font-family:var(--display);font-size:clamp(2rem,6vw,3.4rem);font-weight:800;line-height:1.05;letter-spacing:-.035em;margin-bottom:1rem}
.lede{font-size:1.08rem;color:var(--soft);max-width:36rem;margin:0 auto 2rem}
header.hero.photo .lede{color:rgba(255,255,255,.88)}
.btn{display:inline-block;background:var(--primary);color:#fff;font-weight:600;font-size:1rem;padding:.9rem 1.7rem;border-radius:999px;margin:.25rem}
.btn.alt{background:transparent;color:var(--ink);border:1.5px solid var(--line)}
header.hero.photo .btn.alt{color:#fff;border-color:rgba(255,255,255,.45)}
section{padding:3.8rem 1.6rem}
section.alt{background:var(--wash)}
.label{font-size:.72rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--primary);text-align:center;margin-bottom:.7rem}
h2{font-family:var(--display);font-size:clamp(1.5rem,3.4vw,2.2rem);font-weight:700;letter-spacing:-.03em;text-align:center;margin-bottom:2rem}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:1rem}
.card{background:var(--card,#fff);border:1px solid var(--line);border-radius:14px;padding:1.4rem}
.card h3{font-size:1.05rem;font-weight:700;margin-bottom:.4rem;letter-spacing:-.01em}
.card p{font-size:.92rem;color:var(--soft)}
.tick{color:var(--primary);font-weight:700;display:block;margin-bottom:.5rem}
.prose{max-width:42rem;margin:0 auto;text-align:center;color:var(--soft)}
.gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:.7rem}
.shot{aspect-ratio:4/3;border-radius:12px;background:#e9edf3 center/cover no-repeat}
.pills{display:flex;flex-wrap:wrap;gap:.7rem;justify-content:center}
.pill{display:inline-flex;align-items:center;gap:.5rem;background:var(--card,#fff);border:1px solid var(--line);border-radius:999px;padding:.7rem 1.2rem;font-size:.95rem;font-weight:500}
.pill b{color:var(--primary);font-weight:700}
.quote{max-width:42rem;margin:0 auto;text-align:center}
.quote p{font-family:var(--display);font-size:1.25rem;font-weight:600;letter-spacing:-.02em;line-height:1.5;margin-bottom:.8rem}
.quote span{font-size:.88rem;color:var(--soft)}
.hours{max-width:28rem;margin:0 auto}
.hours div{display:flex;justify-content:space-between;padding:.6rem 0;border-bottom:1px solid var(--line);font-size:.95rem}
.hours div span:last-child{color:var(--soft)}
.band{background:var(--primary);color:#fff;text-align:center}
.band h2{color:#fff;margin-bottom:.7rem}
.band p{opacity:.88;margin-bottom:1.5rem}
.band .btn{background:#fff;color:var(--primary)}
footer{padding:1.8rem 1.6rem;border-top:1px solid var(--line);display:flex;justify-content:space-between;flex-wrap:wrap;gap:.6rem;font-size:.82rem;color:var(--soft)}
footer a{border-bottom:1px solid var(--line)}
@media(max-width:640px){.links{display:none}section{padding:2.8rem 1.2rem}}
`;

function sectionHtml(section: SiteSection, site: SiteConfig): string {
  switch (section.type) {
    case 'services':
      return `<section class="alt"><div class="wrap"><p class="label">${esc(section.label || 'What we do')}</p>
        <h2>${esc(section.title || 'How we can help')}</h2><div class="grid">${(section.items || [])
          .map((i) => `<div class="card"><span class="tick">◆</span><h3>${esc(i[0])}</h3><p>${esc(i[1])}</p></div>`)
          .join('')}</div></div></section>`;
    case 'about':
      return `<section><div class="wrap"><p class="label">${esc(section.label || 'About us')}</p>
        <h2>${esc(section.title || `The story behind ${site.name || ''}`)}</h2>
        <p class="prose">${esc(section.text)}</p></div></section>`;
    case 'gallery': {
      const shots = (section.images || []).map(safeUrl).filter(Boolean) as string[];
      const cells = shots.length ? shots : ['', '', '', ''];
      return `<section><div class="wrap"><p class="label">${esc(section.label || 'Our work')}</p><h2>${esc(section.title || 'Recent jobs')}</h2><div class="gallery">${cells
        .map((src) => `<div class="shot"${src ? ` style="background-image:url(${esc(src)})"` : ''}></div>`)
        .join('')}</div></div></section>`;
    }
    case 'hours':
      return `<section class="alt"><div class="wrap"><p class="label">${esc(section.label || 'Opening hours')}</p><h2>${esc(section.title || 'When we are about')}</h2>
        <div class="hours">${(section.rows || [])
          .map((r) => `<div><span>${esc(r[0])}</span><span>${esc(r[1])}</span></div>`)
          .join('')}</div></div></section>`;
    case 'testimonial':
      return `<section><div class="wrap quote"><p>&ldquo;${esc(section.quote)}&rdquo;</p><span>&mdash; ${esc(section.who)}</span></div></section>`;
    case 'contact': {
      const c = site.contact || {};
      const pills: string[] = [];
      if (c.phone) pills.push(`<a class="pill" href="tel:${esc(String(c.phone).replace(/\s/g, ''))}"><b>Call</b> ${esc(c.phone)}</a>`);
      if (c.email) pills.push(`<a class="pill" href="mailto:${esc(c.email)}"><b>Email</b> ${esc(c.email)}</a>`);
      if (c.address) pills.push(`<span class="pill"><b>Find us</b> ${esc(c.address)}</span>`);
      if (!pills.length) return '';
      return `<section class="alt" id="contact"><div class="wrap"><p class="label">${esc(section.label || 'Get in touch')}</p><h2>${esc(section.title || 'Give us a yell')}</h2>
        <div class="pills">${pills.join('')}</div></div></section>`;
    }
    case 'band':
      return `<section class="band"${section.tint ? ` style="background:${esc(section.tint)}"` : ''}><div class="wrap"><h2>${esc(section.title)}</h2><p>${esc(section.text)}</p>
        <a class="btn" href="#contact">${esc(site.cta || 'Get in touch')}</a></div></section>`;
    default:
      return '';
  }
}

function mixHex(hex: string, target: string, amount: number): string {
  const parse = (h: string) => {
    const v = h.replace('#', '');
    const full = v.length === 3 ? v.split('').map((c) => c + c).join('') : v;
    return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
  };
  const a = parse(hex);
  const b = parse(target);
  return '#' + a.map((c, i) => Math.round(c + (b[i] - c) * amount).toString(16).padStart(2, '0')).join('');
}

const TONES: Record<string, { page: string; ink: string; soft: string; line: string; card: string }> = {
  light: { page: '#ffffff', ink: '#101418', soft: '#5b6472', line: '#e7ebf0', card: '#ffffff' },
  warm: { page: '#fffaf3', ink: '#1b1410', soft: '#6b5a4c', line: '#efe2d2', card: '#fffdf9' },
  dark: { page: '#0e1116', ink: '#f2f5fa', soft: '#a2acbd', line: '#232a35', card: '#161b23' },
};

export function renderSite(site: SiteConfig, slug: string): string {
  const palette = site.palette || {};
  const tone = TONES[site.tone || 'light'] || TONES.light;
  const primary = palette.primary || '#2563eb';
  // On a dark page the alternating band has to be dark too
  const wash = site.tone === 'dark' ? mixHex(primary, tone.page, 0.86) : (palette.wash || '#f6f8fb');
  const logo = safeUrl(site.logo);
  const hero = safeUrl(site.heroImage);
  const name = site.name || slug;
  const contact = site.contact || {};
  const description = (site.lede || site.headline || name).slice(0, 155);

  const body = `
<nav class="top">
  <div class="brand">${logo ? `<img src="${esc(logo)}" alt="${esc(name)}" />` : `<span class="glyph">${esc(initials(name))}</span><span>${esc(name)}</span>`}</div>
  <div class="links"><a href="#top">Home</a><a href="#contact">Contact</a></div>
  <a class="cta" href="#contact">${esc(site.cta || 'Get in touch')}</a>
</nav>
<header class="hero${hero ? ' photo' : ''}" id="top">
  ${hero ? `<div class="hero-photo" style="background-image:url(${esc(hero)})"></div>` : ''}
  <div class="hero-inner">
    ${site.eyebrow ? `<p class="eyebrow">${esc(site.eyebrow)}</p>` : ''}
    <h1>${esc(site.headline || name)}</h1>
    ${site.lede ? `<p class="lede">${esc(site.lede)}</p>` : ''}
    <a class="btn" href="#contact">${esc(site.cta || 'Get in touch')}</a>
    ${contact.phone ? `<a class="btn alt" href="tel:${esc(String(contact.phone).replace(/\s/g, ''))}">${esc(contact.phone)}</a>` : ''}
  </div>
</header>
${(site.sections || []).map((s) => sectionHtml(s, site)).join('')}
<footer>
  <span>&copy; ${new Date().getFullYear()} ${esc(name)}</span>
  <span>Built with <a href="https://garage.co.nz/build">garage.co.nz</a></span>
</footer>`;

  return `<!doctype html>
<html lang="en-NZ">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(name)}</title>
<meta name="description" content="${esc(description)}" />
<link rel="canonical" href="https://${esc(slug)}.garage.co.nz/" />
<meta property="og:title" content="${esc(name)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:type" content="website" />
${hero ? `<meta property="og:image" content="${esc(hero)}" />` : ''}
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Poppins:wght@600;700;800&display=swap" rel="stylesheet" />
<style>${CSS}
:root{--primary:${esc(primary)};--deep:${esc(palette.deep || '#1e40af')};--wash:${esc(wash)};
--ink:${tone.ink};--soft:${tone.soft};--line:${tone.line};--card:${tone.card};
--page:${tone.page};--display:${site.display ? esc(site.display) : "'Poppins',system-ui,sans-serif"};--body:${site.body ? esc(site.body) : "'Inter',system-ui,sans-serif"}}
</style>
</head>
<body>${body}</body>
</html>`;
}

// Shown when someone visits a subdomain nobody has claimed
export function renderAvailable(slug: string): string {
  return `<!doctype html>
<html lang="en-NZ">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(slug)}.garage.co.nz is free</title>
<meta name="robots" content="noindex" />
<link rel="icon" type="image/svg+xml" href="https://garage.co.nz/favicon.svg" />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Poppins:wght@700;800&display=swap" rel="stylesheet" />
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{min-height:100vh;display:grid;place-items:center;text-align:center;padding:2rem;
font-family:'Inter',system-ui,sans-serif;color:#0a0a0a;
background:radial-gradient(ellipse 70% 50% at 50% -10%,rgba(37,99,235,.1),transparent 55%),linear-gradient(180deg,#fff,#f6f8fb)}
p.eyebrow{font-size:.75rem;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#2563eb;margin-bottom:1rem}
h1{font-family:'Poppins',sans-serif;font-size:clamp(1.8rem,6vw,3rem);font-weight:800;letter-spacing:-.04em;line-height:1.05;margin-bottom:1rem;word-break:break-word}
p.sub{color:#404040;margin-bottom:2rem;max-width:32rem}
a.btn{display:inline-flex;align-items:center;gap:.6rem;background:#2563eb;color:#fff;font-weight:600;
padding:1rem 1.9rem;border-radius:999px;text-decoration:none;box-shadow:0 10px 30px rgba(37,99,235,.32)}
a.home{display:block;margin-top:1.6rem;font-size:.9rem;color:#737373}
</style>
</head>
<body>
<div>
  <p class="eyebrow">Nobody has taken this one</p>
  <h1>${esc(slug)}.garage.co.nz<br />is going spare.</h1>
  <p class="sub">Free address, free website. Pick it, chat to the agent for a couple of minutes, and it is yours.</p>
  <a class="btn" href="https://garage.co.nz/build?slug=${encodeURIComponent(slug)}">Build it &rarr;</a>
  <a class="home" href="https://garage.co.nz">garage.co.nz</a>
</div>
</body>
</html>`;
}
