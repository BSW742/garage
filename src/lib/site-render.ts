import { LISTING_CSS, LISTING_FONT_QUERY, renderListingBody } from './listing-render';
import { TRIBUTE_CSS, TRIBUTE_FONT_QUERY, renderTributeBody, MONTAGE_WORDS, type TributePhoto } from './tribute-render';
import { DIET_CSS, DIET_FONT_QUERY, renderDietBody, type DietPost } from './diet-render';
import { CHAIN_CSS, CHAIN_FONT_QUERY, renderChainBody, type ChainNote } from './chain-render';
import { RALLY_CSS, renderRallyBody, type RallyCampaign, type RallyState } from './rally-render';
import { BUBBLE_CSS, BUBBLE_FONT_QUERY, renderBubbleBody } from './bubble-render';
import { GAME_CSS, GAME_FONT_QUERY, renderGameBody } from './game-render';
import { EGGS_CSS, EGGS_FONT_QUERY, renderEggsBody } from './eggs-render';
import { MOGGED_CSS, MOGGED_FONT_QUERY, renderMoggedBody } from './mogged-render';
import { BEAUTY_CSS, BEAUTY_FONT_QUERY, renderBeautyBody } from './beauty-render';
import { WORKSHOP_CSS, WORKSHOP_FONT_QUERY, renderWorkshopBody } from './workshop-render';
import { SAUNA_CSS, SAUNA_FONT_QUERY, renderSaunaBody } from './sauna-render';
import { CLUB_CSS, CLUB_FONT_QUERY, renderClubBody } from './club-render';
import { CHARITY_CSS, CHARITY_FONT_QUERY, renderCharityBody } from './charity-render';
import { HALL_CSS, HALL_FONT_QUERY, renderHallBody } from './hall-render';
import { DAYCARE_CSS, DAYCARE_FONT_QUERY, renderDaycareBody } from './daycare-render';
import { STUDIO_CSS, YOGA_FONT_QUERY, PILATES_FONT_QUERY, renderStudioBody } from './studio-render';
import { TRADE_CSS, TRADE_FONT_QUERY, renderTradeBody } from './trade-render';
import { CLINIC_CSS, CLINIC_FONT_QUERY, renderClinicBody } from './clinic-render';
import { CAFE_CSS, CAFE_FONT_QUERY, renderCafeBody } from './cafe-render';

// Renders a site claimed at <slug>.garage.co.nz from the config the
// builder stored in D1. Mirrors the live preview in /ai.

export interface SiteContact { phone?: string; email?: string; address?: string }
export interface MenuItem { name?: string; price?: string; text?: string }
export interface MenuGroup { heading?: string; note?: string; items?: MenuItem[] }

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
  videoId?: string;
  videos?: string[];
  menu?: MenuGroup[];   // a cafe menu: courses, each with priced items
  partners?: Partner[]; // "we work alongside" — other businesses they work with
}

/**
 * Somebody they work with. The slug is filled in once we have made that
 * business a page of their own, which happens on publish rather than on typing
 * — nobody should be emailed about a site that was never put up.
 */
export interface Partner {
  name: string;
  contact?: string;    // phone, email or website — whatever they had to hand
  slug?: string;       // their page here, once it exists
  sent?: boolean;      // whether they have been told
}
export interface TeamMember {
  name?: string;
  role?: string;
  text?: string;
  image?: string;
}

export interface Product {
  name?: string;
  price?: string;
  text?: string;
  image?: string;
}

export interface CaseStudy {
  title?: string;
  role?: string;
  text?: string;
  videoId?: string;
}

export interface SiteConfig {
  name?: string;
  tone?: 'light' | 'warm' | 'dark';
  // Campaign pages hanging off this site at /<path>. They are part of the
  // config so the owner writes them the same way as everything else, and they
  // publish with the page — only the sign-ups need a table.
  campaigns?: RallyCampaign[];
  style?: 'modern' | 'brutal' | 'classic' | 'cafe' | 'physio' | 'trade' | 'tribute' | 'listing' | 'diet' | 'chain' | 'bubbles' | 'game' | 'eggs' | 'mogged' | 'montage' | 'beauty' | 'yoga' | 'pilates' | 'workshop' | 'sauna'
    | 'rugby' | 'soccer' | 'basketball' | 'charity' | 'townhall' | 'daycare';
  socials?: Record<string, string>;
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
  logoVideo?: string | null;   // plays when the logo is opened
  team?: TeamMember[];         // its own page at /team, when there is anyone on it
  cases?: CaseStudy[];         // its own page at /case-studies
  products?: Product[];        // what the cart sells
  shop?: boolean;              // cart is on unless a site turns it off
  chatLabel?: string;  // what the launcher says, default "Chat right now"
  chat?: boolean;   // chat widget is off until the owner is actually reachable
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
.brand img{height:52px;width:auto;max-width:230px;object-fit:contain}
.brand-zoom{border:0;background:none;padding:0;cursor:zoom-in;display:block;line-height:0}
.logo-zoom{position:fixed;inset:0;z-index:9000;display:none;place-items:center;padding:6vw;
background:rgba(12,14,18,.82);cursor:zoom-out;backdrop-filter:blur(3px)}
.logo-zoom.on{display:grid}
.logo-zoom img,.logo-zoom video{max-width:min(92vw,900px);max-height:82vh;width:auto;object-fit:contain;
border-radius:14px;background:#fff;padding:3vmin;box-shadow:0 24px 70px rgba(0,0,0,.5)}
@media(prefers-reduced-motion:no-preference){.logo-zoom.on img{animation:logopop .18s ease-out}}
@keyframes logopop{from{transform:scale(.94);opacity:0}to{transform:scale(1);opacity:1}}
h1.hero-logo{margin:0 0 1.1rem;line-height:0}
h1.hero-logo img{width:auto;max-width:min(88%,520px);max-height:190px;object-fit:contain}
.hero.photo h1.hero-logo img{filter:drop-shadow(0 6px 22px rgba(0,0,0,.45))}
@media(max-width:640px){.brand img{height:42px;max-width:170px}h1.hero-logo img{max-height:130px}}
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
.alongside{display:flex;flex-wrap:wrap;gap:.6rem;justify-content:center;list-style:none;
margin-top:1.6rem}
.alongside li{border:1px solid var(--line);border-radius:999px;padding:.5rem 1.1rem;
background:var(--card);font-size:.93rem}
.alongside a{color:var(--ink);border-bottom:0}
.alongside a:hover{color:var(--primary)}
.label{font-size:.72rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--primary);text-align:center;margin-bottom:.7rem}
h2{font-family:var(--display);font-size:clamp(1.5rem,3.4vw,2.2rem);font-weight:700;letter-spacing:-.03em;text-align:center;margin-bottom:2rem}
.grid{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:1rem}
.card{background:var(--card,#fff);border:1px solid var(--line);border-radius:14px;padding:1.4rem}
.card h3{font-size:1.05rem;font-weight:700;margin-bottom:.4rem;letter-spacing:-.01em}
.card p{font-size:.92rem;color:var(--soft)}
.prose{max-width:42rem;margin:0 auto;text-align:center;color:var(--soft)}
.gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:.7rem}
.shot{aspect-ratio:4/3;border-radius:12px;background:#e9edf3 center/cover no-repeat}
.pills{display:flex;flex-wrap:wrap;gap:.7rem;justify-content:center}
.pill{display:inline-flex;align-items:center;gap:.5rem;background:var(--card,#fff);border:1px solid var(--line);border-radius:999px;padding:.7rem 1.2rem;font-size:.95rem;font-weight:500}
.map{margin:1.6rem auto 0;max-width:760px;border:1px solid var(--line);border-radius:14px;overflow:hidden;line-height:0}
.map iframe{display:block;width:100%;height:320px;border:0}
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
/* Design styles */
.st-brutal{--display:'Archivo Black',Impact,sans-serif}
.st-brutal h1,.st-brutal h2{text-transform:uppercase;letter-spacing:-.02em}
.st-brutal header.hero{text-align:left;background:var(--wash);border-bottom:3px solid var(--ink)}
.st-brutal .hero-inner{margin:0}
.st-brutal h2{text-align:left}
.st-brutal .label{text-align:left;display:inline-block;background:var(--ink);color:var(--page,#fff);padding:.2rem .5rem}
.st-brutal nav.top{border-bottom:3px solid var(--ink)}
.st-brutal .card{border:3px solid var(--ink);border-radius:0;box-shadow:6px 6px 0 var(--ink)}
.st-brutal .btn,.st-brutal .top .cta,.st-brutal .pill,.st-brutal .glyph{border-radius:0;border:3px solid var(--ink);box-shadow:4px 4px 0 var(--ink);text-transform:uppercase;font-weight:700}
.st-brutal .shot{border-radius:0;border:3px solid var(--ink)}
.st-brutal .band{border-top:3px solid var(--ink);border-bottom:3px solid var(--ink)}
.st-brutal .lede{margin-left:0}
.st-brutal .band{text-align:left}
.st-brutal .hours,.st-brutal .prose,.st-brutal .quote{margin-left:0;text-align:left}
.st-brutal .pills{justify-content:flex-start}
.st-brutal .map{margin-left:0;border-radius:0;border-width:2px}
.st-classic{--display:'Playfair Display',Georgia,serif}
.st-classic h1{font-weight:700;letter-spacing:-.01em}
.st-classic h2{font-weight:600;letter-spacing:0}
.st-classic h2::after{content:'';display:block;width:42px;height:1px;background:var(--primary);margin:.9rem auto 0}
.st-classic header.hero{background:var(--page,#fff);padding:5.5rem 1.6rem}
.st-classic .label{letter-spacing:.24em;color:var(--soft);font-weight:600}
.st-classic .card{border:none;border-top:1px solid var(--line);border-radius:0;padding-left:0;background:none}
.st-classic .btn,.st-classic .top .cta{border-radius:2px;font-weight:500;letter-spacing:.04em}
.st-classic .btn.alt{border-color:var(--primary);color:var(--primary)}
.st-classic .pill,.st-classic .shot{border-radius:2px}
.st-classic section{padding:4.2rem 1.6rem}
.socials{display:flex;gap:.9rem;align-items:center}
.socials a{border-bottom:1px solid var(--line);font-size:.82rem}
.socials a:hover{border-bottom-color:var(--primary);color:var(--primary)}
footer{padding:1.8rem 1.6rem;border-top:1px solid var(--line);display:flex;justify-content:space-between;flex-wrap:wrap;gap:.6rem;font-size:.82rem;color:var(--soft)}
footer a{border-bottom:1px solid var(--line)}
.reel{position:relative;max-width:900px;margin:0 auto}
.reel-track{display:flex;gap:14px;overflow-x:auto;scroll-snap-type:x mandatory;scroll-behavior:smooth;-webkit-overflow-scrolling:touch;scrollbar-width:none;border-radius:14px}
.reel-track::-webkit-scrollbar{display:none}
.reel-slide{position:relative;flex:0 0 100%;scroll-snap-align:center;aspect-ratio:16/9;border-radius:14px;overflow:hidden;background:#000}
.reel.many .reel-slide{flex-basis:88%}
.reel-slide img{width:100%;height:100%;object-fit:cover;display:block}
.reel-play{position:absolute;inset:0;width:100%;height:100%;border:0;background:rgba(0,0,0,.18);cursor:pointer;display:grid;place-items:center;transition:background .2s}
.reel-slide:hover .reel-play{background:rgba(0,0,0,.3)}
.reel-play span{width:72px;height:50px;border-radius:12px;background:rgba(18,18,18,.82);position:relative;display:block;transition:background .2s,transform .2s}
.reel-slide:hover .reel-play span{background:#f00;transform:scale(1.06)}
.reel-play span::after{content:'';position:absolute;top:50%;left:50%;transform:translate(-42%,-50%);border-style:solid;border-width:10px 0 10px 17px;border-color:transparent transparent transparent #fff}
.reel-slide iframe{width:100%;height:100%;border:0;display:block}
.reel-nav{position:absolute;top:50%;transform:translateY(-50%);width:44px;height:44px;border-radius:50%;border:1px solid var(--line);background:var(--card,#fff);color:var(--ink);font-size:26px;line-height:1;cursor:pointer;display:grid;place-items:center;box-shadow:0 4px 14px rgba(0,0,0,.14);transition:transform .18s,opacity .18s;z-index:2}
.reel-nav:hover{transform:translateY(-50%) scale(1.08)}
.reel-nav[disabled]{opacity:.3;cursor:default;transform:translateY(-50%)}
.reel-nav.prev{left:-10px}
.reel-nav.next{right:-10px}
.reel-count{text-align:center;margin:.9rem 0 0;font-size:.85rem;color:var(--soft)}
@media(max-width:720px){.reel-nav{display:none}.reel.many .reel-slide{flex-basis:92%}}
@media(prefers-reduced-motion:reduce){.reel-track{scroll-behavior:auto}}
.st-brutal .reel-slide{border-radius:0;border:2px solid var(--ink)}
.st-brutal .reel-nav{border-radius:0;border-width:2px}
.page-head{padding:4.5rem 1.6rem 1rem;text-align:center}
.page-head h1{font-family:var(--font-display,inherit);font-size:clamp(2.1rem,6vw,3.4rem);line-height:1.05;letter-spacing:-.03em;margin:.4rem 0 0}
.profiles{padding-top:1.5rem}
.profile{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);gap:clamp(1.4rem,4vw,3.2rem);
align-items:center;padding:clamp(1.8rem,4vw,3.4rem) 0;border-bottom:1px solid var(--line)}
/* Order alone would move the words into the photo's column, so swap the
   columns as well and the photo keeps its size on both sides. */
.profile.flip{grid-template-columns:minmax(0,1.15fr) minmax(0,1fr)}
.profile:last-child{border-bottom:0}
.profile-media{position:relative;aspect-ratio:1;border-radius:18px;overflow:hidden;background:var(--wash)}
.profile-media img{width:100%;height:100%;object-fit:cover;display:block}
.profile-blank{width:100%;height:100%;display:grid;place-items:center;font-size:3rem;font-weight:800;color:var(--primary);opacity:.5}
.profile-words h2{font-size:clamp(1.5rem,3.4vw,2.1rem);margin:0;letter-spacing:-.02em}
.profile-role{margin:.35rem 0 0;color:var(--primary);font-weight:600;font-size:.95rem}
.profile-text{margin:.9rem 0 0;color:var(--soft);line-height:1.65;max-width:52ch}
/* Every second one turns around, so the eye zigzags down the page. */
.profile.flip .profile-media{order:2}
.profile.flip .profile-words{order:1}
.profile-video{position:relative;width:100%;height:100%;cursor:pointer;background:#000}
.profile-video img{width:100%;height:100%;object-fit:cover;display:block}
.profile-video .reel-play{position:absolute;inset:0;width:100%;height:100%;border:0;background:rgba(0,0,0,.2);cursor:pointer;display:grid;place-items:center}
.profile-video:hover .reel-play{background:rgba(0,0,0,.32)}
.profile-video iframe{width:100%;height:100%;border:0;display:block}
@media(max-width:720px){
.profile,.profile.flip{grid-template-columns:1fr;gap:1.1rem}
.profile.flip .profile-media{order:0}
.profile.flip .profile-words{order:0}
.profile-media{max-width:min(88vw,420px)}
}
.st-brutal .profile-media{border-radius:0;border:2px solid var(--ink)}
.shop{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:1.2rem;text-align:left}
.buy{border:1px solid var(--line);border-radius:14px;overflow:hidden;background:var(--card,#fff);display:flex;flex-direction:column}
.buy-shot{aspect-ratio:4/3;background:var(--wash) center/cover no-repeat}
.buy h3{margin:.9rem 1rem 0;font-size:1rem}
.buy p{margin:.35rem 1rem 0;font-size:.88rem;color:var(--soft);line-height:1.5}
.buy-foot{margin-top:auto;padding:1rem;display:flex;align-items:center;justify-content:space-between;gap:.6rem}
.buy-price{font-weight:700;color:var(--primary);font-variant-numeric:tabular-nums}
.buy-add{border:0;background:var(--primary);color:#fff;font:inherit;font-size:.85rem;font-weight:600;
padding:.45rem .95rem;border-radius:999px;cursor:pointer}
.buy-add:hover{background:var(--deep)}

/* Above the chat launcher, which sits at bottom:18px and is about 50 tall. */
.cart-open{position:fixed;right:18px;bottom:84px;z-index:8000;width:48px;height:48px;border-radius:50%;
border:1px solid var(--line);background:var(--card,#fff);color:var(--ink);display:grid;place-items:center;
cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.16);transition:transform .15s,color .15s}
.cart-open:hover{transform:translateY(-2px);color:var(--primary)}
.cart-count{position:absolute;top:-3px;right:-3px;min-width:18px;height:18px;border-radius:999px;
background:var(--primary);color:#fff;font-size:11px;font-weight:700;display:grid;place-items:center;padding:0 5px}
.cart-count[hidden]{display:none}
.cart-back{position:fixed;inset:0;background:rgba(10,12,16,.45);z-index:8500}
.cart-back[hidden]{display:none}
.cart{position:fixed;top:0;right:0;bottom:0;width:min(400px,92vw);background:var(--card,#fff);z-index:8600;
display:flex;flex-direction:column;box-shadow:-18px 0 50px rgba(0,0,0,.22)}
.cart[hidden]{display:none}
.cart-head{display:flex;align-items:center;justify-content:space-between;padding:1.1rem 1.2rem;border-bottom:1px solid var(--line)}
.cart-shut{border:0;background:none;font-size:1rem;cursor:pointer;color:var(--soft)}
.cart-body{flex:1;overflow-y:auto;padding:1rem 1.2rem;display:flex;flex-direction:column;gap:.7rem}
.cart-row{display:grid;grid-template-columns:1fr auto auto auto;gap:.6rem;align-items:center;font-size:.9rem}
.cart-qty{display:inline-flex;align-items:center;gap:.45rem}
.cart-qty button{width:22px;height:22px;border:1px solid var(--line);background:none;border-radius:6px;cursor:pointer;color:var(--ink)}
.cart-line{font-variant-numeric:tabular-nums;color:var(--soft)}
.cart-drop{border:0;background:none;color:var(--soft);cursor:pointer;font-size:.8rem}
.cart-drop:hover{color:#dc2626}
.cart-empty,.cart-done,.cart-warn{color:var(--soft);font-size:.9rem;line-height:1.6;margin:0}
.cart-browse{align-self:flex-start;border:1px solid var(--line);background:none;color:var(--primary);
font:inherit;font-size:.88rem;font-weight:600;padding:.5rem 1rem;border-radius:999px;cursor:pointer}
.cart-browse:hover{border-color:var(--primary);background:var(--wash)}
.cart-warn{color:#b42318}
.cart-foot{border-top:1px solid var(--line);padding:1rem 1.2rem 1.3rem}
.cart-foot[hidden]{display:none}
.cart-total{display:flex;justify-content:space-between;font-size:1rem;margin-bottom:.5rem}
.cart-promise{font-size:.8rem;color:var(--soft);line-height:1.5;margin:0 0 .9rem}
.cart-foot input,.cart-foot textarea{width:100%;font:inherit;font-size:.9rem;padding:.55rem .7rem;margin-bottom:.5rem;
border:1px solid var(--line);border-radius:9px;background:var(--page);color:var(--ink)}
.cart-send{width:100%;border:0;background:var(--primary);color:#fff;font:inherit;font-weight:600;
padding:.7rem;border-radius:10px;cursor:pointer}
.cart-send:disabled{opacity:.6}
.st-brutal .buy,.st-brutal .cart-open{border-radius:0;border-width:2px}
.rates{max-width:640px;margin:0 auto;text-align:left}
.rates>div{display:flex;align-items:baseline;gap:.7rem;padding:.75rem 0;border-bottom:1px solid var(--line)}
.rates>div:last-child{border-bottom:0}
.rate-name{font-weight:600}
.rate-dots{flex:1;border-bottom:1px dotted var(--line);transform:translateY(-.28rem);min-width:1.5rem}
.rate-price{font-weight:700;color:var(--primary);white-space:nowrap;font-variant-numeric:tabular-nums}
.rate-note{max-width:640px;margin:1.2rem auto 0;font-size:.85rem;color:var(--soft);text-align:left}
.st-brutal .rates>div{border-bottom-width:2px}
.faq{max-width:760px;margin:0 auto;text-align:left}
.faq details{border:1px solid var(--line);border-radius:12px;background:var(--card,#fff);margin-bottom:.6rem;overflow:hidden}
.faq summary{cursor:pointer;padding:.9rem 1.1rem;font-weight:600;list-style:none}
.faq summary::-webkit-details-marker{display:none}
.faq summary::after{content:'+';float:right;color:var(--primary);font-weight:700}
.faq details[open] summary::after{content:'−'}
.faq details p{padding:0 1.1rem 1rem;margin:0;color:var(--soft)}
@media(max-width:640px){.links{display:none}section{padding:2.8rem 1.2rem}}
`;

// What the nav offers, in page order. Sections that are not somewhere you
// would navigate to — a testimonial, a call-to-action band — stay out of it.
const NAV_LABELS: Record<string, string> = {
  services: 'Services',
  about: 'About',
  gallery: 'Gallery',
  hours: 'Hours',
  pricing: 'Pricing',
  video: 'Video',
  faq: 'FAQ',
  contact: 'Contact',
};

function navLinks(site: SiteConfig, base = '', here = ''): string {
  const seen = new Set<string>();
  const links = [`<a href="${base || '#top'}">Home</a>`];
  for (const section of site.sections || []) {
    const label = NAV_LABELS[section.type];
    if (!label || seen.has(section.type)) continue;
    // A contact section with nothing in it never renders, so never link to it.
    if (section.type === 'contact') {
      const c = site.contact || {};
      if (!c.phone && !c.email && !c.address) continue;
    }
    seen.add(section.type);
    links.push(`<a href="${base}#${section.type}">${label}</a>`);
  }

  // Pages, not anchors — and only when there is something on them.
  if ((site.team || []).length) {
    links.push(`<a href="/team"${here === '/team' ? ' aria-current="page"' : ''}>Team</a>`);
  }
  if ((site.cases || []).length) {
    links.push(`<a href="/case-studies"${here === '/case-studies' ? ' aria-current="page"' : ''}>Case studies</a>`);
  }
  return links.join('');
}

// Two sections of the same type would otherwise both claim the same id, which
// is invalid and sends the nav link to whichever came first anyway.
// Everything worth linking to gets an id. The nav shows a subset — shop is
// reached by the cart icon, not by a link, but still needs somewhere to land.
const ANCHORED = new Set([...Object.keys(NAV_LABELS), 'shop']);

function renderSections(site: SiteConfig): string {
  const used = new Set<string>();
  return (site.sections || [])
    .map((section) => {
      const wanted = ANCHORED.has(section.type) ? section.type : '';
      const anchor = wanted && !used.has(wanted) ? ` id="${wanted}"` : '';
      if (anchor) used.add(wanted);
      return sectionHtml(section, site, anchor);
    })
    .join('');
}

/**
 * The row both extra pages are made of: a square on one side, words on the
 * other, and the sides swap every time down the page. One shape, two uses —
 * a face for the team, a film for a case study.
 */
function profileRow(media: string, title: string, role: string, text: string, flip: boolean): string {
  if (!media && !title && !text) return '';
  return `<div class="profile${flip ? ' flip' : ''}">
    <div class="profile-media">${media}</div>
    <div class="profile-words">
      ${title ? `<h2>${esc(title)}</h2>` : ''}
      ${role ? `<p class="profile-role">${esc(role)}</p>` : ''}
      ${text ? `<p class="profile-text">${esc(text)}</p>` : ''}
    </div>
  </div>`;
}

export function renderTeam(site: SiteConfig, slug: string): string {
  const name = site.name || slug;
  const people = (site.team || []).filter(Boolean);
  const rows = people
    .map((person, i) => {
      const photo = safeUrl(person.image);
      const media = photo
        ? `<img src="${esc(photo)}" alt="${esc(person.name || '')}" loading="lazy" />`
        : `<div class="profile-blank">${esc(initials(person.name || name))}</div>`;
      return profileRow(media, person.name || '', person.role || '', person.text || '', i % 2 === 1);
    })
    .join('');

  const body = `${pageNav(site, slug, '/team')}
<section class="page-head"><div class="wrap">
  <p class="label">${esc(site.name || name)}</p>
  <h1>Our team</h1>
</div></section>
<section class="profiles"><div class="wrap">${rows}</div></section>
${pageFoot(site, name)}`;

  return shell(site, slug, {
    title: `Our team · ${name}`,
    description: `The people behind ${name}.`,
    path: '/team',
    body,
  });
}

/**
 * A campaign page at a path on the business's own site. It borrows the parent's
 * nav, colours and type on purpose: the share link should look like them, not
 * like a landing page somebody bolted on.
 */
export function renderRallyPage(
  site: SiteConfig,
  slug: string,
  campaign: RallyCampaign,
  state: RallyState
): string {
  const name = site.name || slug;
  const path = '/' + String(campaign.path).replace(/^\/+/, '');
  return shell(site, slug, {
    title: `${campaign.title} — ${name}`,
    description: (campaign.blurb || `${campaign.title}. It runs if enough people are in.`).slice(0, 155),
    path,
    body: renderRallyBody(site, slug, campaign, state, pageNav(site, slug, path), pageFoot(site, name)),
    extraCss: RALLY_CSS,
  });
}

export function renderCases(site: SiteConfig, slug: string): string {
  const name = site.name || slug;
  const studies = (site.cases || []).filter(Boolean);
  const rows = studies
    .map((study, i) => {
      const id = String(study.videoId || '').match(/^[A-Za-z0-9_-]{11}$/)?.[0];
      const media = id
        ? `<div class="profile-video" data-yt="${esc(id)}">
             <img src="https://i.ytimg.com/vi/${esc(id)}/hqdefault.jpg" alt="${esc(study.title || 'Case study')}" loading="lazy" />
             <button type="button" class="reel-play" aria-label="Play"><span></span></button>
           </div>`
        : `<div class="profile-blank">▶</div>`;
      return profileRow(media, study.title || '', study.role || '', study.text || '', i % 2 === 1);
    })
    .join('');

  const body = `${pageNav(site, slug, '/case-studies')}
<section class="page-head"><div class="wrap">
  <p class="label">${esc(name)}</p>
  <h1>Case studies</h1>
</div></section>
<section class="profiles"><div class="wrap">${rows}</div></section>
${pageFoot(site, name)}`;

  return shell(site, slug, {
    title: `Case studies · ${name}`,
    description: `Work ${name} has done.`,
    path: '/case-studies',
    body,
  });
}

// On a sub-page the section anchors have to point back at the home page.
function pageNav(site: SiteConfig, slug: string, here: string): string {
  const logo = safeUrl(site.logo);
  const name = site.name || slug;
  return `<nav class="top">
  <div class="brand"><a href="/">${logo
    ? `<img src="${esc(logo)}" alt="${esc(name)}" />`
    : `<span class="glyph">${esc(initials(name))}</span><span>${esc(name)}</span>`}</a></div>
  <div class="links">${navLinks(site, '/', here)}</div>
  <a class="cta" href="/#contact">${esc(site.cta || 'Get in touch')}</a>
</nav>`;
}

function pageFoot(site: SiteConfig, name: string): string {
  return `<footer>
  <span>&copy; ${new Date().getFullYear()} ${esc(name)}</span>
  ${socialLinks(site.socials)}
  <span>Built with <a href="https://garage.co.nz/ai">garage.co.nz</a></span>
</footer>`;
}

interface PageMeta {
  title: string;
  description: string;
  path: string;
  body: string;
  // Styles only this page needs, kept off every other page in the site
  extraCss?: string;
}

function sectionHtml(section: SiteSection, site: SiteConfig, anchor: string): string {
  switch (section.type) {
    case 'services':
      return `<section class="alt"${anchor}><div class="wrap"><p class="label">${esc(section.label || 'What we do')}</p>
        <h2>${esc(section.title || 'How we can help')}</h2><ul class="grid">${(section.items || [])
          .map((i) => `<li class="card"><h3>${esc(i[0])}</h3><p>${esc(i[1])}</p></li>`)
          .join('')}</ul></div></section>`;
    case 'about':
      return `<section${anchor}><div class="wrap"><p class="label">${esc(section.label || 'About us')}</p>
        <h2>${esc(section.title || `The story behind ${site.name || ''}`)}</h2>
        <p class="prose">${esc(section.text)}</p></div></section>`;
    case 'gallery': {
      const shots = (section.images || []).map(safeUrl).filter(Boolean) as string[];
      const cells = shots.length ? shots : ['', '', '', ''];
      return `<section${anchor}><div class="wrap"><p class="label">${esc(section.label || 'Our work')}</p><h2>${esc(section.title || 'Recent jobs')}</h2><div class="gallery">${cells
        .map((src) => `<div class="shot"${src ? ` style="background-image:url(${esc(src)})"` : ''}></div>`)
        .join('')}</div></div></section>`;
    }
    case 'hours':
      return `<section class="alt"${anchor}><div class="wrap"><p class="label">${esc(section.label || 'Opening hours')}</p><h2>${esc(section.title || 'When we are about')}</h2>
        <div class="hours">${(section.rows || [])
          .map((r) => `<div><span>${esc(r[0])}</span><span>${esc(r[1])}</span></div>`)
          .join('')}</div></div></section>`;
    case 'shop':
      return `<section${anchor}><div class="wrap"><p class="label">${esc(section.label || 'Shop')}</p>
        <h2>${esc(section.title || 'Have a look')}</h2><div class="shop">${(site.products || [])
          .map((product, i) => {
            const picture = safeUrl(product.image);
            return `<div class="buy">
              <div class="buy-shot"${picture ? ` style="background-image:url(${esc(picture)})"` : ''}></div>
              <h3>${esc(product.name || '')}</h3>
              ${product.text ? `<p>${esc(product.text)}</p>` : ''}
              <div class="buy-foot">
                <span class="buy-price">${esc(product.price || '')}</span>
                <button type="button" class="buy-add" data-i="${i}"
                  data-name="${esc(product.name || '')}" data-price="${esc(product.price || '')}">Add</button>
              </div>
            </div>`;
          })
          .join('')}</div></div></section>`;
    case 'alongside': {
      // Deliberately absent when empty. The builder sees the gap in the
      // editor; a visitor should never see a hollow block on a live page.
      const partners = (section.partners || []).filter((p) => p && p.name);
      if (!partners.length) return '';
      return `<section${anchor}><div class="wrap"><p class="label">${esc(section.label || 'Who we work with')}</p>
        <h2>${esc(section.title || 'We work alongside')}</h2>
        <ul class="alongside">${partners
          .map((p) => {
            const inner = `<span>${esc(p.name)}</span>`;
            return p.slug
              ? `<li><a href="https://${esc(p.slug)}.garage.co.nz">${inner}</a></li>`
              : `<li>${inner}</li>`;
          })
          .join('')}</ul></div></section>`;
    }
    case 'pricing':
      return `<section class="alt"${anchor}><div class="wrap"><p class="label">${esc(section.label || 'Pricing')}</p>
        <h2>${esc(section.title || 'What it costs')}</h2><div class="rates">${(section.rows || [])
          .map((r) => `<div><span class="rate-name">${esc(r[0])}</span><span class="rate-dots"></span><span class="rate-price">${esc(r[1])}</span></div>`)
          .join('')}</div>${section.text ? `<p class="rate-note">${esc(section.text)}</p>` : ''}</div></section>`;
    case 'faq':
      return `<section${anchor}><div class="wrap"><p class="label">${esc(section.label || 'Questions')}</p>
        <h2>${esc(section.title || 'Common questions')}</h2><div class="faq">${(section.items || [])
          .map((i) => `<details><summary>${esc(i[0])}</summary><p>${esc(i[1])}</p></details>`)
          .join('')}</div></div></section>`;
    case 'video': {
      const ids = (Array.isArray(section.videos) ? section.videos : section.videoId ? [section.videoId] : [])
        .map((v) => String(v).match(/^[A-Za-z0-9_-]{11}$/)?.[0])
        .filter(Boolean) as string[];
      if (!ids.length) return '';
      const many = ids.length > 1;
      const slides = ids
        .map(
          (id, i) => `<div class="reel-slide" data-yt="${esc(id)}">
            <img src="https://i.ytimg.com/vi/${esc(id)}/hqdefault.jpg" alt="Video ${i + 1} of ${ids.length}" loading="lazy" />
            <button type="button" class="reel-play" aria-label="Play video ${i + 1}"><span></span></button>
          </div>`
        )
        .join('');
      // With one video the arrows would be furniture, so it just reads as a
      // single framed film.
      const controls = many
        ? `<button class="reel-nav prev" type="button" aria-label="Previous video">&#8249;</button>
           <button class="reel-nav next" type="button" aria-label="Next video">&#8250;</button>`
        : '';
      const count = many ? `<p class="reel-count"><span>1</span> / ${ids.length}</p>` : '';
      return `<section${anchor}><div class="wrap"><p class="label">${esc(section.label || 'Watch')}</p>
        <h2>${esc(section.title || 'See us at work')}</h2>
        <div class="reel${many ? ' many' : ''}">
          <div class="reel-track">${slides}</div>
          ${controls}
        </div>${count}</div></section>`;
    }
    case 'testimonial':
      return `<section><div class="wrap quote"><p>&ldquo;${esc(section.quote)}&rdquo;</p><span>&mdash; ${esc(section.who)}</span></div></section>`;
    case 'contact': {
      const c = site.contact || {};
      const pills: string[] = [];
      if (c.phone) pills.push(`<a class="pill" href="tel:${esc(String(c.phone).replace(/\s/g, ''))}"><b>Call</b> ${esc(c.phone)}</a>`);
      if (c.email) pills.push(`<a class="pill" href="mailto:${esc(c.email)}"><b>Email</b> ${esc(c.email)}</a>`);
      if (c.address) pills.push(`<span class="pill"><b>Find us</b> ${esc(c.address)}</span>`);
      if (!pills.length) return '';
      // A map is only meaningful once there is an address to point at.
      const map = c.address
        ? `<div class="map"><iframe src="https://maps.google.com/maps?q=${encodeURIComponent(c.address)}&amp;output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Map of ${esc(c.address)}"></iframe></div>`
        : '';
      return `<section class="alt"${anchor}><div class="wrap"><p class="label">${esc(section.label || 'Get in touch')}</p><h2>${esc(section.title || 'Give us a yell')}</h2>
        <div class="pills">${pills.join('')}</div>${map}</div></section>`;
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

function socialLinks(socials?: Record<string, string>): string {
  const entries = Object.entries(socials || {}).filter(([, url]) => safeUrl(url));
  if (!entries.length) return '';
  const label: Record<string, string> = {
    facebook: 'Facebook', instagram: 'Instagram', linkedin: 'LinkedIn',
    youtube: 'YouTube', tiktok: 'TikTok',
  };
  return `<span class="socials">${entries
    .map(([name, url]) => `<a href="${esc(safeUrl(url) as string)}" target="_blank" rel="noopener">${esc(label[name] || name)}</a>`)
    .join('')}</span>`;
}

/**
 * The cart. A placeholder for a real shop rather than a pretend one: nothing
 * here asks for a card, because nothing here can take a payment. What it does
 * is collect what someone wants and how to reach them, and say plainly that a
 * person will check stock and come back about paying.
 */
// Sits in the nav beside the call to action, where a cart belongs.
function cartButton(site: SiteConfig): string {
  if (site.shop === false) return '';
  return `<button type="button" class="cart-open" id="cart-open" aria-label="Your cart">
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6h15l-1.5 9h-12z"/><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M6 6L5 2H2"/></svg>
  <span class="cart-count" id="cart-count" hidden>0</span>
</button>`;
}

function cartHtml(site: SiteConfig, slug: string): string {
  // Taking Shop out of the nav means an empty cart is the only signpost left,
  // so it has to point at the products rather than just shrug.
  const hasShop = (site.sections || []).some((s) => s && s.type === 'shop')
    && (site.products || []).length > 0;
  const config = JSON.stringify({ slug, name: site.name || slug, shop: hasShop })
    .replace(/</g, '\\u003c');
  return `${cartButton(site)}

<div class="cart-back" id="cart-back" hidden></div>
<aside class="cart" id="cart" hidden aria-label="Your cart">
  <div class="cart-head">
    <strong>Your cart</strong>
    <button type="button" class="cart-shut" id="cart-shut" aria-label="Close">&#10005;</button>
  </div>
  <div class="cart-body" id="cart-body"></div>
  <div class="cart-foot" id="cart-foot" hidden>
    <div class="cart-total"><span>Total</span><strong id="cart-total">$0</strong></div>
    <p class="cart-promise">No payment now. A human checks your order and gets in touch to sort payment.</p>
    <form id="cart-form">
      <input id="cart-name" placeholder="Your name" autocomplete="name" required />
      <input id="cart-email" type="email" placeholder="Email" autocomplete="email" />
      <input id="cart-phone" placeholder="Phone" autocomplete="tel" />
      <textarea id="cart-note" rows="2" placeholder="Anything we should know?"></textarea>
      <button type="submit" class="cart-send">Send this through</button>
    </form>
  </div>
</aside>

<script>(function(){
var C = ${config};
var KEY = 'cart:' + C.slug;
var items = [];
try { items = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { items = []; }

var openBtn = document.getElementById('cart-open');
var back = document.getElementById('cart-back');
var panel = document.getElementById('cart');
var bodyEl = document.getElementById('cart-body');
var foot = document.getElementById('cart-foot');
var countEl = document.getElementById('cart-count');

function money(v){ var n = parseFloat(String(v).replace(/[^0-9.]/g,'')); return isNaN(n) ? 0 : n; }
function save(){ try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) {} }

function draw(){
  var total = 0, count = 0;
  bodyEl.innerHTML = '';
  items.forEach(function(it, i){
    count += it.qty; total += money(it.price) * it.qty;
    var row = document.createElement('div');
    row.className = 'cart-row';
    row.innerHTML = '<span class="cart-name"></span>' +
      '<span class="cart-qty"><button type="button" data-d="-1" aria-label="One fewer">&minus;</button>' +
      '<b>' + it.qty + '</b>' +
      '<button type="button" data-d="1" aria-label="One more">+</button></span>' +
      '<span class="cart-line"></span>' +
      '<button type="button" class="cart-drop" data-drop="1" aria-label="Remove">&#10005;</button>';
    row.querySelector('.cart-name').textContent = it.name;
    row.querySelector('.cart-line').textContent = it.price || '';
    row.querySelectorAll('[data-d]').forEach(function(b){
      b.addEventListener('click', function(){
        it.qty += Number(b.dataset.d);
        if (it.qty < 1) items.splice(i, 1);
        save(); draw();
      });
    });
    row.querySelector('[data-drop]').addEventListener('click', function(){
      items.splice(i, 1); save(); draw();
    });
    bodyEl.appendChild(row);
  });

  if (!items.length) {
    bodyEl.innerHTML = '<p class="cart-empty">Nothing in here yet.</p>';
    if (C.shop) {
      var go = document.createElement('button');
      go.type = 'button';
      go.className = 'cart-browse';
      go.textContent = 'See what we sell';
      go.addEventListener('click', function(){
        show(false);
        var shop = document.getElementById('shop');
        if (shop) shop.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      bodyEl.appendChild(go);
    }
  }
  foot.hidden = !items.length;
  document.getElementById('cart-total').textContent = '$' + total.toFixed(2).replace(/\\.00$/, '');
  countEl.textContent = count;
  countEl.hidden = !count;
}

function show(on){
  panel.hidden = !on; back.hidden = !on;
  document.body.style.overflow = on ? 'hidden' : '';
}

document.querySelectorAll('.buy-add').forEach(function(b){
  b.addEventListener('click', function(){
    var found = items.filter(function(i){ return i.name === b.dataset.name; })[0];
    if (found) found.qty += 1;
    else items.push({ name: b.dataset.name, price: b.dataset.price, qty: 1 });
    save(); draw(); show(true);
  });
});

openBtn.addEventListener('click', function(){ draw(); show(true); });
document.getElementById('cart-shut').addEventListener('click', function(){ show(false); });
back.addEventListener('click', function(){ show(false); });
document.addEventListener('keydown', function(e){ if (e.key === 'Escape') show(false); });

document.getElementById('cart-form').addEventListener('submit', async function(e){
  e.preventDefault();
  var name = document.getElementById('cart-name').value.trim();
  var email = document.getElementById('cart-email').value.trim();
  var phone = document.getElementById('cart-phone').value.trim();
  if (!name || (!email && !phone)) {
    alertless('We need your name and either an email or a phone number.');
    return;
  }
  var btn = e.target.querySelector('.cart-send');
  btn.disabled = true; btn.textContent = 'Sending…';
  try {
    var res = await fetch('https://garage.co.nz/api/shop/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: C.slug, name: name, email: email, phone: phone,
        note: document.getElementById('cart-note').value.trim(),
        items: items, total: document.getElementById('cart-total').textContent
      })
    });
    if (!res.ok) throw new Error('bad');
    items = []; save();
    bodyEl.innerHTML = '<p class="cart-done">Thanks ' + name.split(' ')[0] +
      '. ' + C.name + ' will check stock and be in touch about payment.</p>';
    foot.hidden = true; countEl.hidden = true;
  } catch (err) {
    btn.disabled = false; btn.textContent = 'Send this through';
    alertless('That did not send. Try again in a moment.');
  }
});

// A blocking dialog would freeze the page, so say it in the panel.
function alertless(message){
  var note = document.createElement('p');
  note.className = 'cart-warn';
  note.textContent = message;
  var old = bodyEl.querySelector('.cart-warn');
  if (old) old.remove();
  bodyEl.prepend(note);
}

draw();
})();</script>`;
}

// The chat widget every published site carries. It lives in a shadow root so
// the site's own styles — which vary a lot between modern, brutal and classic
// — cannot reach in and break it.
function chatWidget(site: SiteConfig, slug: string): string {
  const faqSection = (site.sections || []).find((s) => s.type === 'faq');
  const faq = (faqSection?.items || []).slice(0, 4);
  const config = JSON.stringify({
    slug,
    name: site.name || 'We',
    primary: site.palette?.primary || '#2563eb',
    label: site.chatLabel || 'Chat right now',
    faq,
  }).replace(/</g, '\\u003c');

  return `<div id="garage-chat"></div>
<script>(function(){
var C = ${config};
var API = 'https://garage.co.nz';
var KEY = 'garage-chat:' + C.slug;
var threadId = '';
try { threadId = localStorage.getItem(KEY) || ''; } catch (e) {}
var seen = 0, timer = null, asked = false, replyTime = '';

var ICON = '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.3 8.3 0 0 1-2.9-.5L4 20l1.4-4.2A7.2 7.2 0 0 1 4 11.5 7.5 7.5 0 0 1 12 4a7.5 7.5 0 0 1 8 7.5z"/></svg>';
var CLOSE = '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
var host = document.getElementById('garage-chat');
var root = host.attachShadow({ mode: 'open' });
root.innerHTML = [
'<style>',
':host{all:initial}',
'*{box-sizing:border-box;font-family:Inter,system-ui,-apple-system,sans-serif}',
'.bubble{position:fixed;right:18px;bottom:18px;display:inline-flex;align-items:center;gap:9px;',
'padding:13px 20px 13px 17px;border-radius:999px;border:0;background:' + C.primary + ';color:#fff;',
'font-size:15px;font-weight:600;letter-spacing:-.01em;cursor:pointer;z-index:2147483000;',
'box-shadow:0 6px 16px rgba(0,0,0,.16),0 12px 32px rgba(0,0,0,.14);',
'transition:transform .18s cubic-bezier(.2,.8,.3,1),box-shadow .18s ease}',
'.bubble:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(0,0,0,.18),0 18px 44px rgba(0,0,0,.18)}',
'.bubble:active{transform:translateY(0)}',
'.bubble svg{display:block;flex:none}',
'.bubble .txt{white-space:nowrap}',
'.bubble.open{padding:13px 16px}',
'.panel{position:fixed;right:18px;bottom:78px;width:340px;max-width:calc(100vw - 36px);max-height:min(560px,calc(100vh - 110px));',
'background:#fff;border-radius:16px;box-shadow:0 18px 50px rgba(0,0,0,.24);display:none;flex-direction:column;overflow:hidden;z-index:2147483000}',
'.panel.on{display:flex}',
'.head{padding:14px 16px;background:' + C.primary + ';color:#fff}',
'.head b{display:block;font-size:15px}',
'.head span{font-size:12px;opacity:.85}',
'.log{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:8px;min-height:90px}',
'.m{max-width:80%;padding:9px 12px;border-radius:14px;font-size:14px;line-height:1.45;white-space:pre-wrap;word-wrap:break-word}',
'.them{align-self:flex-start;background:#f1f3f7;color:#10131a}',
'.me{align-self:flex-end;background:' + C.primary + ';color:#fff}',
'.chips{display:flex;flex-wrap:wrap;gap:6px;padding:0 14px 10px}',
'.chip{border:1px solid #dfe4ec;background:#fff;color:#33405c;border-radius:999px;padding:6px 11px;font-size:12.5px;cursor:pointer;text-align:left}',
'.chip:hover{border-color:' + C.primary + ';color:' + C.primary + '}',
'form{display:flex;gap:6px;padding:10px;border-top:1px solid #e9edf3}',
'input{flex:1;font:inherit;font-size:14px;padding:9px 12px;border:1px solid #dfe4ec;border-radius:11px;outline:none}',
'input:focus{border-color:' + C.primary + '}',
'button.send{border:0;background:' + C.primary + ';color:#fff;border-radius:11px;padding:0 14px;font-size:14px;font-weight:600;cursor:pointer}',
'@media(max-width:420px){.panel{right:10px;left:10px;width:auto;bottom:80px}}',
'</style>',
'<button class="bubble" part="bubble" aria-label="' + C.label + '">' + ICON + '<span class="txt">' + C.label + '</span></button>',
'<div class="panel" role="dialog" aria-label="Chat">',
'<div class="head"><b>' + esc(C.name) + '</b><span class="sub"></span></div>',
'<div class="log"></div>',
'<div class="chips"></div>',
'<form><input placeholder="Ask a question..." autocomplete="off" /><button class="send" type="submit">Send</button></form>',
'</div>'
].join('');

function esc(t){ var d = document.createElement('div'); d.textContent = t; return d.innerHTML; }
var bubble = root.querySelector('.bubble');
var panel = root.querySelector('.panel');
var log = root.querySelector('.log');
var chips = root.querySelector('.chips');
var form = root.querySelector('form');
var input = root.querySelector('input');
var sub = root.querySelector('.sub');

function say(text, mine){
  var d = document.createElement('div');
  d.className = 'm ' + (mine ? 'me' : 'them');
  d.textContent = text;
  log.appendChild(d);
  log.scrollTop = log.scrollHeight;
}

function drawChips(){
  chips.innerHTML = '';
  if (threadId) return;
  C.faq.forEach(function(pair){
    var b = document.createElement('button');
    b.className = 'chip';
    b.type = 'button';
    b.textContent = pair[0];
    b.addEventListener('click', function(){
      say(pair[0], true);
      say(pair[1], false);
      chips.innerHTML = '';
    });
    chips.appendChild(b);
  });
}

function setSub(){
  sub.textContent = replyTime ? C.name + ' ' + replyTime : 'Ask us anything';
}

async function poll(){
  try {
    var url = API + '/api/chat?slug=' + encodeURIComponent(C.slug) +
      (threadId ? '&threadId=' + encodeURIComponent(threadId) + '&after=' + seen : '');
    var res = await fetch(url);
    var data = await res.json();
    if (data.replyTime) { replyTime = data.replyTime; setSub(); }
    (data.messages || []).forEach(function(m){
      if (m.id > seen) { seen = m.id; if (m.sender === 'owner') say(m.body, false); }
    });
  } catch (e) {}
}

form.addEventListener('submit', async function(e){
  e.preventDefault();
  var body = input.value.trim();
  if (!body) return;
  input.value = '';
  say(body, true);
  chips.innerHTML = '';
  var payload = { slug: C.slug, body: body };
  if (threadId) payload.threadId = threadId;
  if (asked) { payload.contact = body; }
  try {
    var res = await fetch(API + '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    var data = await res.json();
    if (data.threadId) {
      var isNew = !threadId;
      threadId = data.threadId;
      try { localStorage.setItem(KEY, threadId); } catch (e) {}
      if (data.replyTime) { replyTime = data.replyTime; setSub(); }
      // Straight in rather than waiting for the next poll. The whole point of
      // answering is that it is immediate.
      if (data.bot && data.bot.body) {
        setTimeout(function(){ say(data.bot.body, false); }, 350);
      }
      // Only ask for a phone number when a person will actually need it. If
      // the assistant answered and did not hand over, they have what they came
      // for and being asked for contact details is just a form appearing.
      if (isNew && !asked && !(data.bot && !data.bot.handOver)) {
        asked = true;
        setTimeout(function(){
          say('Thanks — who am I speaking with, and what is the best phone or email to reach you on?', false);
        }, data.bot ? 1400 : 400);
      }
    }
  } catch (e) {
    say('That did not send. Try again in a moment.', false);
  }
});

bubble.addEventListener('click', function(){
  var on = panel.classList.toggle('on');
  bubble.innerHTML = on ? CLOSE : ICON + '<span class="txt">' + C.label + '</span>';
  bubble.classList.toggle('open', on);
  if (on) {
    drawChips();
    setSub();
    poll();
    if (!timer) timer = setInterval(poll, 5000);
    input.focus();
  } else if (timer) {
    clearInterval(timer);
    timer = null;
  }
});

poll();
})();</script>`;
}

export function renderSite(
  site: SiteConfig,
  slug: string,
  sent: TributePhoto[] | DietPost[] | ChainNote[] = [],
  state: { unlocked?: boolean } = {}
): string {
  // Yoga and pilates: one renderer, two temperatures. The timetable, the
  // passes and the teachers are the same job either way.
  if (site.style === 'yoga' || site.style === 'pilates') {
    const warm = site.style === 'yoga';
    const studio: SiteConfig = {
      ...site,
      shop: false,
      palette: warm
        ? { primary: '#b4794f', deep: '#26221d', wash: '#faf7f2', ...(site.palette || {}) }
        : { primary: '#1f6feb', deep: '#15181c', wash: '#f5f6f7', ...(site.palette || {}) },
    };
    const room = studio.name || slug;
    return shell(studio, slug, {
      title: room,
      description: (studio.lede || studio.headline || room).slice(0, 155),
      path: '/',
      body: renderStudioBody(studio, slug),
    });
  }

  // Three codes, one club. A rugby, football and basketball club put the same
  // things on a page — who can play at what age, who pays for the ground, when
  // training is — so this is the yoga and pilates arrangement again.
  if (site.style === 'rugby' || site.style === 'soccer' || site.style === 'basketball') {
    const colours: Record<string, any> = {
      rugby:      { primary: '#3f9e56', deep: '#0f1512', wash: '#161d19' },
      soccer:     { primary: '#3b82f6', deep: '#0c1220', wash: '#131b2c' },
      basketball: { primary: '#e0742c', deep: '#17120e', wash: '#211a14' },
    };
    const club: SiteConfig = {
      ...site,
      shop: false,
      tone: 'dark',
      palette: { ...colours[site.style], ...(site.palette || {}) },
    };
    const name = club.name || slug;
    return shell(club, slug, {
      title: name,
      description: (club.lede || club.headline || name).slice(0, 155),
      path: '/',
      body: renderClubBody(club, slug),
    });
  }

  // Asking for money. The amounts are price tags on real objects, and the
  // registration number is in the footer so a stranger can be checked.
  if (site.style === 'charity') {
    const cause: SiteConfig = {
      ...site,
      shop: false,
      palette: { primary: '#c2410c', deep: '#1c1a17', wash: '#fbfaf8', ...(site.palette || {}) },
    };
    const name = cause.name || slug;
    return shell(cause, slug, {
      title: name,
      description: (cause.lede || cause.headline || name).slice(0, 155),
      path: '/',
      body: renderCharityBody(cause, slug),
    });
  }

  // A room, a kitchen and a bond. Two rates, because a hall has two.
  if (site.style === 'townhall') {
    const hall: SiteConfig = {
      ...site,
      shop: false,
      palette: { primary: '#7c6a46', deep: '#1f1d18', wash: '#f7f5f0', ...(site.palette || {}) },
    };
    const name = hall.name || slug;
    return shell(hall, slug, {
      title: name,
      description: (hall.lede || hall.headline || name).slice(0, 155),
      path: '/',
      body: renderHallBody(hall, slug),
    });
  }

  // Early childhood. Fees banded by age because the funding is, ratios that
  // are law, and a licence that is never invented.
  if (site.style === 'daycare') {
    const centre: SiteConfig = {
      ...site,
      shop: false,
      palette: { primary: '#d97757', deep: '#26221d', wash: '#fdfbf7', ...(site.palette || {}) },
    };
    const name = centre.name || slug;
    return shell(centre, slug, {
      title: name,
      description: (centre.lede || centre.headline || name).slice(0, 155),
      path: '/',
      body: renderDaycareBody(centre, slug),
    });
  }

  // Makers who teach: pottery, jewellery, wood, glass. Paper and unglazed
  // clay, and every class says what you carry out of the door with you.
  if (site.style === 'workshop') {
    const bench: SiteConfig = {
      ...site,
      shop: false,
      palette: { primary: '#a4623c', deep: '#241f1a', wash: '#f6f2ea', ...(site.palette || {}) },
    };
    const studio = bench.name || slug;
    return shell(bench, slug, {
      title: studio,
      description: (bench.lede || bench.headline || studio).slice(0, 155),
      path: '/',
      body: renderWorkshopBody(bench, slug),
    });
  }

  // Heat and cold. A dark room with an ember under it, and the round
  // explained before anything is asked of the visitor.
  if (site.style === 'sauna') {
    const bath: SiteConfig = {
      ...site,
      shop: false,
      tone: 'dark',
      palette: { primary: '#d4622a', deep: '#14110f', wash: '#1d1917', ...(site.palette || {}) },
    };
    const house = bath.name || slug;
    return shell(bath, slug, {
      title: house,
      description: (bath.lede || bath.headline || house).slice(0, 155),
      path: '/',
      body: renderSaunaBody(bath, slug),
    });
  }

  // Salons and spas: one picture given room, treatments priced in the open,
  // and booking never more than a thumb away.
  if (site.style === 'beauty') {
    const salon: SiteConfig = {
      ...site,
      shop: false,
      palette: { primary: '#b07d6a', deep: '#2b2320', wash: '#faf6f2', ...(site.palette || {}) },
    };
    const room = salon.name || slug;
    return shell(salon, slug, {
      title: room,
      description: (salon.lede || salon.headline || room).slice(0, 155),
      path: '/',
      body: renderBeautyBody(salon, slug),
    });
  }

  // Selling expertise: a heavy headline with one italic word, three ticks, a
  // wall of clients, and a definition of the thing they want to be known for.
  if (site.style === 'mogged') {
    const agency: SiteConfig = {
      ...site,
      shop: false,
      palette: { primary: '#2f4fff', deep: '#0d1836', wash: '#f6f8fd', ...(site.palette || {}) },
    };
    const firm = agency.name || slug;
    return shell(agency, slug, {
      title: firm,
      description: (agency.lede || agency.headline || firm).slice(0, 155),
      path: '/',
      body: renderMoggedBody(agency, slug),
    });
  }

  // A producer rather than a service: the range, the proof, the stockists.
  if (site.style === 'eggs') {
    const farm: SiteConfig = {
      ...site,
      chat: false,
      palette: { primary: '#e07a2f', deep: '#8a4b16', wash: '#fbf6ec', ...(site.palette || {}) },
    };
    const maker = farm.name || slug;
    return shell(farm, slug, {
      title: maker,
      description: (farm.lede || farm.headline || maker).slice(0, 155),
      path: '/',
      body: renderEggsBody(farm, slug),
    });
  }

  // Space Invaders, where the invaders are what the business does. The list
  // underneath is the real page; the game is a way through it.
  if (site.style === 'game') {
    const arcade: SiteConfig = {
      ...site,
      shop: false,
      chat: false,
      palette: { primary: '#7c5cff', deep: '#2bb3c0', wash: '#07060d', ...(site.palette || {}) },
    };
    const player = arcade.name || slug;
    return shell(arcade, slug, {
      title: player,
      description: (arcade.lede || `${player}. Everything we do, as a game.`).slice(0, 155),
      path: '/',
      body: renderGameBody(arcade, slug),
    });
  }

  // The work, floating, with the words tucked inside it. No nav, no sections
  // — a gallery where the pictures are the whole page.
  if (site.style === 'bubbles') {
    const art: SiteConfig = {
      ...site,
      chat: false,
      palette: { primary: '#7c5cff', deep: '#2bb3c0', wash: '#fbfaff', ...(site.palette || {}) },
    };
    const maker = art.name || slug;
    return shell(art, slug, {
      title: maker,
      description: (art.lede || `The work of ${maker}.`).slice(0, 155),
      path: '/',
      body: renderBubbleBody(art, slug),
    });
  }

  // Messages for one person, sealed until enough of them have come in. No nav,
  // no sections, no cart — a counter and a reason to pass it on.
  if (site.style === 'chain') {
    const gift: SiteConfig = {
      ...site,
      shop: false,
      chat: false,
      palette: { primary: '#b4763a', deep: '#1c1a16', wash: '#f6f2ea', ...(site.palette || {}) },
    };
    const forWhom = gift.name || slug;
    return shell(gift, slug, {
      title: gift.eyebrow ? `${forWhom} — ${gift.eyebrow}` : forWhom,
      description: (gift.lede || `Add a message for ${forWhom}.`).slice(0, 155),
      path: '/',
      body: renderChainBody(gift, slug, sent as ChainNote[], !!state.unlocked),
    });
  }

  // A food diary in public: a scoreboard, then every day so far. No nav, no
  // sections, no cart — the tally is the site.
  if (site.style === 'diet') {
    const log: SiteConfig = {
      ...site,
      shop: false,
      chat: false,
      palette: { primary: '#cf3626', deep: '#16150f', wash: '#f7f5f0', ...(site.palette || {}) },
    };
    const eater = log.name || slug;
    return shell(log, slug, {
      title: eater,
      description: (log.lede || `Everything ${eater} eats, in public.`).slice(0, 155),
      path: '/',
      body: renderDietBody(log, slug, sent as DietPost[]),
    });
  }

  // The same wall without the mourning: a title, then the pictures. No
  // portrait, no dates, nobody has died.
  if (site.style === 'montage') {
    const wall: SiteConfig = {
      ...site,
      shop: false,
      chat: false,
      palette: { primary: '#c9c3b8', deep: '#0d0d0e', wash: '#17171a', ...(site.palette || {}) },
    };
    const what = wall.name || slug;
    return shell(wall, slug, {
      title: what,
      description: (wall.lede || `${what} — pictures.`).slice(0, 155),
      path: '/',
      body: renderTributeBody(wall, slug, sent as TributePhoto[], MONTAGE_WORDS),
    });
  }

  // A memorial: a name, two dates, and a wall of photographs. No nav, no
  // sections, no cart, no chat widget.
  if (site.style === 'tribute') {
    const quiet: SiteConfig = {
      ...site,
      shop: false,
      chat: false,
      palette: { primary: '#c9c3b8', deep: '#0d0d0e', wash: '#17171a', ...(site.palette || {}) },
    };
    const who = quiet.name || slug;
    return shell(quiet, slug, {
      title: who,
      description: (quiet.eyebrow ? `${who}, ${quiet.eyebrow}. ` : '') + 'In memory.',
      path: '/',
      body: renderTributeBody(quiet, slug, sent as TributePhoto[]),
    });
  }

  // The cafe template is its own page from the nav down — a different skeleton,
  // not a restyle of this one — so it only borrows the shell.
  if (site.style === 'cafe') {
    const warm: SiteConfig = {
      ...site,
      palette: { primary: '#a8442a', deep: '#7a2f1d', wash: '#f4ebdd', ...(site.palette || {}) },
    };
    const cafeName = warm.name || slug;
    return shell(warm, slug, {
      title: cafeName,
      description: (warm.lede || warm.headline || cafeName).slice(0, 155),
      path: '/',
      body: renderCafeBody(warm, slug),
    });
  }

  // One thing for sale: photos, a price, the numbers, and the honest bit.
  if (site.style === 'listing') {
    const sale: SiteConfig = {
      ...site,
      shop: false,
      palette: { primary: '#1f6feb', deep: '#14161a', wash: '#f4f5f7', ...(site.palette || {}) },
    };
    const what = sale.headline || sale.name || slug;
    return shell(sale, slug, {
      title: sale.eyebrow ? `${what} — ${sale.eyebrow}` : what,
      description: (sale.lede || what).slice(0, 155),
      path: '/',
      body: renderListingBody(sale, slug),
    });
  }

  // Dark, dense, phone-first. Its own skeleton too.
  if (site.style === 'trade') {
    const bold: SiteConfig = {
      ...site,
      palette: { primary: '#f2591f', deep: '#1e2225', wash: '#f4f5f3', ...(site.palette || {}) },
    };
    const tradeName = bold.name || slug;
    return shell(bold, slug, {
      title: tradeName,
      description: (bold.lede || bold.headline || tradeName).slice(0, 155),
      path: '/',
      body: renderTradeBody(bold, slug),
    });
  }

  // Light and airy, and its own skeleton — the shell is all it borrows.
  if (site.style === 'physio') {
    const calm: SiteConfig = {
      ...site,
      palette: { primary: '#4f6b52', deep: '#2f3d2c', wash: '#eef1e8', ...(site.palette || {}) },
    };
    const clinicName = calm.name || slug;
    return shell(calm, slug, {
      title: clinicName,
      description: (calm.lede || calm.headline || clinicName).slice(0, 155),
      path: '/',
      body: renderClinicBody(calm, slug),
    });
  }

  const palette = site.palette || {};
  const tone = TONES[site.tone || 'light'] || TONES.light;
  const primary = palette.primary || '#2563eb';
  // On a dark page the alternating band has to be dark too
  const wash = site.tone === 'dark' ? mixHex(primary, tone.page, 0.86) : (palette.wash || '#f6f8fb');
  const logo = safeUrl(site.logo);
  const logoFilm = safeUrl(site.logoVideo);
  const hero = safeUrl(site.heroImage);
  const name = site.name || slug;
  const contact = site.contact || {};
  const description = (site.lede || site.headline || name).slice(0, 155);

  // Same words, ignoring case and punctuation, means the headline is only
  // repeating the name the logo already carries.
  const plain = (v: string) => String(v || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const heroLogo = !!logo && plain(site.headline || name) === plain(name);

  const body = `
<nav class="top">
  <div class="brand">${logo
    ? `<button type="button" class="brand-zoom" aria-label="See the logo larger"><img src="${esc(logo)}" alt="${esc(name)}" /></button>`
    : `<span class="glyph">${esc(initials(name))}</span><span>${esc(name)}</span>`}</div>
  <div class="links">${navLinks(site)}</div>
  <a class="cta" href="#contact">${esc(site.cta || 'Get in touch')}</a>
</nav>
<header class="hero${hero ? ' photo' : ''}" id="top">
  ${hero ? `<div class="hero-photo" style="background-image:url(${esc(hero)})"></div>` : ''}
  <div class="hero-inner">
    ${site.eyebrow ? `<p class="eyebrow">${esc(site.eyebrow)}</p>` : ''}
    ${heroLogo
      ? `<h1 class="hero-logo"><img src="${esc(logo)}" alt="${esc(name)}" /></h1>`
      : `<h1>${esc(site.headline || name)}</h1>`}
    ${site.lede ? `<p class="lede">${esc(site.lede)}</p>` : ''}
    <a class="btn" href="#contact">${esc(site.cta || 'Get in touch')}</a>
    ${contact.phone ? `<a class="btn alt" href="tel:${esc(String(contact.phone).replace(/\s/g, ''))}">${esc(contact.phone)}</a>` : ''}
  </div>
</header>
${renderSections(site)}
<footer>
  <span>&copy; ${new Date().getFullYear()} ${esc(name)}</span>
  ${socialLinks(site.socials)}
  <span>Built with <a href="https://garage.co.nz/ai">garage.co.nz</a></span>
</footer>`;

  return shell(site, slug, {
    title: name,
    description,
    path: '/',
    body,
  });
}


/** What the business is, in the one form every crawler and model already parses. */
export function businessSchema(site: SiteConfig, slug: string): Record<string, unknown> {
  const base = `https://${slug}.garage.co.nz`;
  const contact = site.contact || ({} as any);
  const services = (site.sections || [])
    .filter((s) => s.type === 'services')
    .flatMap((s) => (s.items || []).map((i: any) => String(i[0] || '')))
    .filter(Boolean);
  const hourRows = (site.sections || []).find((s) => s.type === 'hours')?.rows || [];

  const menuSections = (site.sections || []).filter((s) => s.type === 'menu');

  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    // A cafe that says it is a cafe gets read as one. The menu below only
    // means anything under this type.
    '@type': site.style === 'cafe' ? 'CafeOrCoffeeShop'
      : site.style === 'physio' ? 'Physiotherapy'
      : 'LocalBusiness',
    name: site.name || slug,
    url: base,
    description: site.lede || site.headline || '',
  };
  if (site.logo) data.logo = site.logo;
  if (site.heroImage) data.image = site.heroImage;
  if (contact.phone) data.telephone = contact.phone;
  if (contact.email) data.email = contact.email;
  if (contact.address) {
    data.address = { '@type': 'PostalAddress', streetAddress: contact.address, addressCountry: 'NZ' };
    data.areaServed = contact.address;
  }
  if (hourRows.length) {
    data.openingHours = hourRows.map((r: any) => `${r[0]} ${r[1]}`);
  }
  if (services.length) {
    data.makesOffer = services.map((name) => ({
      '@type': 'Offer',
      itemOffered: { '@type': 'Service', name },
    }));
  }
  // The menu, in the shape an assistant already knows how to read, so "what
  // does this place do for breakfast" can be answered without the page.
  if (menuSections.length) {
    const groups = menuSections.flatMap((section) => section.menu || []);
    if (groups.length) {
      data.hasMenu = {
        '@type': 'Menu',
        hasMenuSection: groups.map((group) => ({
          '@type': 'MenuSection',
          name: group.heading || '',
          hasMenuItem: (group.items || []).map((item) => {
            const entry: Record<string, unknown> = { '@type': 'MenuItem', name: item.name || '' };
            if (item.text) entry.description = item.text;
            if (item.price) {
              entry.offers = {
                '@type': 'Offer',
                price: String(item.price).replace(/[^0-9.]/g, ''),
                priceCurrency: 'NZD',
              };
            }
            return entry;
          }),
        })),
      };
    }
  }
  return data;
}

/** The plain-language brief an AI gets handed when it comes looking. */
export function llmsTxt(site: SiteConfig, slug: string): string {
  const contact = site.contact || ({} as any);
  const lines: string[] = [`# ${site.name || slug}`, ''];
  if (site.lede || site.headline) lines.push(`> ${site.lede || site.headline}`, '');
  if (contact.address) lines.push(`Based in ${contact.address}.`, '');

  for (const section of site.sections || []) {
    if (section.type === 'services' && (section.items || []).length) {
      lines.push('## What we do', '');
      for (const item of section.items as any[]) {
        lines.push(`- **${item[0]}** — ${item[1] || ''}`.trim());
      }
      lines.push('');
    }
    if (section.type === 'menu' && (section.menu || []).length) {
      lines.push('## Menu', '');
      for (const group of section.menu as any[]) {
        if (group.heading) lines.push(`### ${group.heading}`, '');
        for (const item of group.items || []) {
          const price = item.price ? ` — ${item.price}` : '';
          const note = item.text ? `. ${item.text}` : '';
          lines.push(`- **${item.name}**${price}${note}`);
        }
        lines.push('');
      }
    }
    if ((section.type === 'specs' || section.type === 'included' || section.type === 'honest')
        && (section.items || []).length) {
      lines.push(
        section.type === 'specs' ? '## Details'
          : section.type === 'included' ? "## What's included"
          : '## Known faults',
        ''
      );
      if (section.text) lines.push(String(section.text), '');
      for (const item of section.items as any[]) lines.push(`- **${item[0]}** ${item[1] || ''}`.trim());
      lines.push('');
    }
    if ((section.type === 'area' || section.type === 'credentials') && (section.items || []).length) {
      lines.push(section.type === 'area' ? '## Areas we cover' : '## Licences and memberships', '');
      if (section.text) lines.push(String(section.text), '');
      for (const item of section.items as any[]) lines.push(`- **${item[0]}** ${item[1] || ''}`.trim());
      lines.push('');
    }
    if ((section.type === 'conditions' || section.type === 'steps' || section.type === 'acc')
        && (section.items || []).length) {
      const heading = section.type === 'conditions' ? '## What we treat'
        : section.type === 'steps' ? '## How it works'
        : '## ACC';
      lines.push(heading, '');
      if (section.text) lines.push(String(section.text), '');
      for (const item of section.items as any[]) {
        lines.push(`- **${item[0]}** ${item[1] || ''}`.trim());
      }
      lines.push('');
    }
    if (section.type === 'about' && section.text) {
      lines.push('## About', '', String(section.text), '');
    }
    if (section.type === 'hours' && (section.rows || []).length) {
      lines.push('## Opening hours', '');
      for (const row of section.rows as any[]) lines.push(`- ${row[0]}: ${row[1]}`);
      lines.push('');
    }
    if (section.type === 'faq' && (section.items || []).length) {
      lines.push('## Common questions', '');
      for (const item of section.items as any[]) lines.push(`- **${item[0]}** ${item[1] || ''}`.trim());
      lines.push('');
    }
  }

  lines.push('## Contact', '');
  if (contact.phone) lines.push(`- Phone: ${contact.phone}`);
  if (contact.email) lines.push(`- Email: ${contact.email}`);
  if (contact.address) lines.push(`- Address: ${contact.address}`);
  lines.push(`- Website: https://${slug}.garage.co.nz`, '');
  return lines.join('\n');
}

export function llmIndex(site: SiteConfig, slug: string): Record<string, unknown> {
  const base = `https://${slug}.garage.co.nz`;
  return {
    version: '1.0',
    name: site.name || slug,
    description: site.lede || site.headline || '',
    url: base,
    instructions: `${base}/llms.txt`,
    entity: businessSchema(site, slug),
    updated: new Date().toISOString().slice(0, 10),
  };
}

function shell(site: SiteConfig, slug: string, page: PageMeta): string {
  const palette = site.palette || {};
  const tone = TONES[site.tone || 'light'] || TONES.light;
  const primary = palette.primary || '#2563eb';
  const wash = site.tone === 'dark' ? mixHex(primary, tone.page, 0.86) : (palette.wash || '#f6f8fb');
  const logo = safeUrl(site.logo);
  const logoFilm = safeUrl(site.logoVideo);
  const hero = safeUrl(site.heroImage);
  const name = site.name || slug;
  const body = page.body;
  const description = page.description;
  const extraFonts =
    site.style === 'brutal' ? '&family=Archivo+Black'
    : site.style === 'classic' ? '&family=Playfair+Display:wght@600;700'
    : site.style === 'cafe' ? CAFE_FONT_QUERY
    : site.style === 'physio' ? CLINIC_FONT_QUERY
    : site.style === 'trade' ? TRADE_FONT_QUERY
    : site.style === 'tribute' || site.style === 'montage' ? TRIBUTE_FONT_QUERY
    : site.style === 'listing' ? LISTING_FONT_QUERY
    : site.style === 'diet' ? DIET_FONT_QUERY
    : site.style === 'chain' ? CHAIN_FONT_QUERY
    : site.style === 'bubbles' ? BUBBLE_FONT_QUERY
    : site.style === 'game' ? GAME_FONT_QUERY
    : site.style === 'eggs' ? EGGS_FONT_QUERY
    : site.style === 'mogged' ? MOGGED_FONT_QUERY
    : site.style === 'beauty' ? BEAUTY_FONT_QUERY
    : site.style === 'workshop' ? WORKSHOP_FONT_QUERY
    : site.style === 'sauna' ? SAUNA_FONT_QUERY
    : site.style === 'rugby' || site.style === 'soccer' || site.style === 'basketball' ? CLUB_FONT_QUERY
    : site.style === 'charity' ? CHARITY_FONT_QUERY
    : site.style === 'townhall' ? HALL_FONT_QUERY
    : site.style === 'daycare' ? DAYCARE_FONT_QUERY
    : site.style === 'yoga' ? YOGA_FONT_QUERY
    : site.style === 'pilates' ? PILATES_FONT_QUERY
    : '';

  return `<!doctype html>
<html lang="en-NZ">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(description)}" />
<link rel="canonical" href="https://${esc(slug)}.garage.co.nz${esc(page.path)}" />
<link rel="llms" type="text/markdown" href="https://${esc(slug)}.garage.co.nz/llms.txt" />
<script type="application/ld+json">${JSON.stringify(businessSchema(site, slug)).replace(/</g, '\\u003c')}</script>
<meta property="og:title" content="${esc(page.title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:type" content="website" />
${hero ? `<meta property="og:image" content="${esc(hero)}" />` : ''}
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Poppins:wght@600;700;800${extraFonts}&display=swap" rel="stylesheet" />
<style>${CSS}${site.style === 'cafe' ? CAFE_CSS : ''}${site.style === 'physio' ? CLINIC_CSS : ''}${site.style === 'trade' ? TRADE_CSS : ''}${site.style === 'tribute' || site.style === 'montage' ? TRIBUTE_CSS : ''}${site.style === 'listing' ? LISTING_CSS : ''}${site.style === 'diet' ? DIET_CSS : ''}${site.style === 'chain' ? CHAIN_CSS : ''}${site.style === 'bubbles' ? BUBBLE_CSS : ''}${site.style === 'game' ? GAME_CSS : ''}${site.style === 'eggs' ? EGGS_CSS : ''}${site.style === 'mogged' ? MOGGED_CSS : ''}${site.style === 'beauty' ? BEAUTY_CSS : ''}${site.style === 'workshop' ? WORKSHOP_CSS : ''}${site.style === 'sauna' ? SAUNA_CSS : ''}${site.style === 'rugby' || site.style === 'soccer' || site.style === 'basketball' ? CLUB_CSS : ''}${site.style === 'charity' ? CHARITY_CSS : ''}${site.style === 'townhall' ? HALL_CSS : ''}${site.style === 'daycare' ? DAYCARE_CSS : ''}${site.style === 'yoga' || site.style === 'pilates' ? STUDIO_CSS : ''}${page.extraCss || ''}
:root{--primary:${esc(primary)};--deep:${esc(palette.deep || '#1e40af')};--wash:${esc(wash)};
--ink:${tone.ink};--soft:${tone.soft};--line:${tone.line};--card:${tone.card};
--page:${tone.page}}
</style>
</head>
<body class="st-${esc(site.style || 'modern')}${site.style === 'cafe' ? ' cf' : ''}${site.style === 'physio' ? ' ph' : ''}${site.style === 'trade' ? ' td' : ''}${site.style === 'tribute' || site.style === 'montage' ? ' tr' : ''}${site.style === 'listing' ? ' ls' : ''}${site.style === 'diet' ? ' dt' : ''}${site.style === 'chain' ? ' ch' : ''}${site.style === 'bubbles' ? ' bb' : ''}${site.style === 'game' ? ' gm' : ''}${site.style === 'eggs' ? ' eg' : ''}${site.style === 'mogged' ? ' mg' : ''}${site.style === 'beauty' ? ' bt' : ''}${site.style === 'workshop' ? ' wk' : ''}${site.style === 'sauna' ? ' sn' : ''}${site.style === 'rugby' ? ' cb' : ''}${site.style === 'soccer' ? ' cb soc' : ''}${site.style === 'basketball' ? ' cb bkb' : ''}${site.style === 'charity' ? ' ch2' : ''}${site.style === 'townhall' ? ' hl' : ''}${site.style === 'daycare' ? ' dc' : ''}${site.style === 'yoga' ? ' st' : ''}${site.style === 'pilates' ? ' st pil' : ''}">${body}${logo ? `<div class="logo-zoom" id="logo-zoom">${logoFilm
    ? `<video id="logo-film" src="${esc(logoFilm)}" poster="${esc(logo)}" muted playsinline loop preload="none"></video>`
    : `<img src="${esc(logo)}" alt="${esc(name)}" />`}</div>` : ''}${site.shop === false ? '' : cartHtml(site, slug)}${site.chat ? chatWidget(site, slug) : ''}<script>(function(){var z=document.getElementById('logo-zoom'),b=document.querySelector('.brand-zoom');
if(!z||!b)return;
function shut(){z.classList.remove('on');document.body.style.overflow='';
var f=document.getElementById('logo-film');if(f){try{f.pause();}catch(e){}}}
var film=document.getElementById('logo-film');
b.addEventListener('click',function(){z.classList.add('on');document.body.style.overflow='hidden';
if(film){try{film.currentTime=0;film.play();}catch(e){}}});
z.addEventListener('click',shut);
document.addEventListener('keydown',function(e){if(e.key==='Escape')shut();});})();</script>
<script>document.querySelectorAll('.profile-video').forEach(function(v){
v.addEventListener('click',function(){
var f=document.createElement('iframe');
f.src='https://www.youtube-nocookie.com/embed/'+v.dataset.yt+'?autoplay=1&rel=0';
f.allow='accelerometer;autoplay;clipboard-write;encrypted-media;picture-in-picture';
f.allowFullscreen=true;f.title='Case study';v.innerHTML='';v.appendChild(f);});});</script>
<script>document.querySelectorAll('.reel').forEach(function(r){
var track=r.querySelector('.reel-track'),slides=[].slice.call(r.querySelectorAll('.reel-slide'));
slides.forEach(function(s){s.querySelector('.reel-play').addEventListener('click',function(){
slides.forEach(function(o){if(o!==s&&o.querySelector('iframe'))o.innerHTML=o.dataset.poster;});
s.dataset.poster=s.innerHTML;
var f=document.createElement('iframe');
f.src='https://www.youtube-nocookie.com/embed/'+s.dataset.yt+'?autoplay=1&rel=0';
f.allow='accelerometer;autoplay;clipboard-write;encrypted-media;picture-in-picture';
f.allowFullscreen=true;f.title='Video';s.innerHTML='';s.appendChild(f);});});
var prev=r.querySelector('.reel-nav.prev'),next=r.querySelector('.reel-nav.next');
if(!prev)return;
function go(d){track.scrollBy({left:d*track.clientWidth*.9,behavior:'smooth'});}
prev.addEventListener('click',function(){go(-1);});
next.addEventListener('click',function(){go(1);});
var count=r.parentNode.querySelector('.reel-count span');
function sync(){var i=Math.round(track.scrollLeft/(track.scrollWidth/slides.length));
if(count)count.textContent=Math.min(slides.length,i+1);
prev.disabled=track.scrollLeft<8;
next.disabled=track.scrollLeft+track.clientWidth>=track.scrollWidth-8;}
track.addEventListener('scroll',sync);sync();});</script></body>
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
  <a class="btn" href="https://garage.co.nz/ai?slug=${encodeURIComponent(slug)}">Build it &rarr;</a>
  <a class="home" href="https://garage.co.nz">garage.co.nz</a>
</div>
</body>
</html>`;
}
