# garage.co.nz Marketplace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an AI-first car marketplace where AI agents can browse listings, extract structured data, and help users find cars.

**Architecture:** Astro SSR site with JSON data store. Each page optimized for AI parsing with semantic HTML and JSON-LD structured data. llms.txt provides explicit agent instructions.

**Tech Stack:** Astro 5, TypeScript, JSON file storage (day one)

---

## File Structure

| File | Responsibility |
|------|----------------|
| `src/data/listings.json` | Seed data: 20 car listings |
| `src/lib/listings.ts` | Data access: load, filter, get by ID |
| `src/components/Layout.astro` | Base layout with site metadata and JSON-LD |
| `src/components/ListingCard.astro` | Reusable card for listing grids |
| `src/pages/index.astro` | Landing page (replaces Pac-Man) |
| `src/pages/cars/index.astro` | All listings with query param filtering |
| `src/pages/cars/[id].astro` | Single listing detail with JSON-LD |
| `src/pages/sell.astro` | Sell form (stores to JSON) |
| `src/pages/api/listings.ts` | POST endpoint for new listings |
| `public/llms.txt` | Agent instructions |

---

## Task 1: Data Layer

**Files:**
- Create: `src/data/listings.json`
- Create: `src/lib/listings.ts`

### Step 1.1: Create seed data

- [ ] Create `src/data/listings.json` with 20 realistic NZ car listings:

```json
[
  {
    "id": "corolla-2018-wgtn",
    "make": "Toyota",
    "model": "Corolla",
    "year": 2018,
    "kms": 85000,
    "price": 14500,
    "location": "Wellington",
    "description": "Reliable daily driver, full service history. One owner, no accidents. Just had WOF and service.",
    "photos": ["https://images.unsplash.com/photo-1623869675781-80aa31012a5a?w=800"],
    "sellerContact": { "email": "sarah@example.com", "phone": "021 123 4567" },
    "createdAt": "2026-03-20T10:00:00Z"
  },
  {
    "id": "swift-2020-akl",
    "make": "Suzuki",
    "model": "Swift",
    "year": 2020,
    "kms": 42000,
    "price": 18900,
    "location": "Auckland",
    "description": "Low kms, excellent condition. Perfect city car with great fuel economy.",
    "photos": ["https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800"],
    "sellerContact": { "email": "mike@example.com", "phone": "027 234 5678" },
    "createdAt": "2026-03-19T14:30:00Z"
  },
  {
    "id": "hilux-2019-chch",
    "make": "Toyota",
    "model": "Hilux SR5",
    "year": 2019,
    "kms": 95000,
    "price": 42000,
    "location": "Christchurch",
    "description": "Workhorse ute, tow bar, canopy included. Great for trades or towing.",
    "photos": ["https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=800"],
    "sellerContact": { "email": "tradiejim@example.com" },
    "createdAt": "2026-03-18T09:00:00Z"
  },
  {
    "id": "mazda3-2021-wgtn",
    "make": "Mazda",
    "model": "Mazda3 GSX",
    "year": 2021,
    "kms": 28000,
    "price": 29500,
    "location": "Wellington",
    "description": "Premium hatch with all the toys. Heads-up display, leather seats, sunroof.",
    "photos": ["https://images.unsplash.com/photo-1612825173281-9a193378f1ef?w=800"],
    "sellerContact": { "email": "lisa.w@example.com", "phone": "022 345 6789" },
    "createdAt": "2026-03-17T16:00:00Z"
  },
  {
    "id": "cx5-2017-akl",
    "make": "Mazda",
    "model": "CX-5 GSX",
    "year": 2017,
    "kms": 112000,
    "price": 22000,
    "location": "Auckland",
    "description": "Family SUV, spacious and comfortable. Minor scratches on bumper.",
    "photos": ["https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800"],
    "sellerContact": { "email": "thewongs@example.com", "phone": "021 456 7890" },
    "createdAt": "2026-03-16T11:30:00Z"
  },
  {
    "id": "civic-2019-ham",
    "make": "Honda",
    "model": "Civic RS",
    "year": 2019,
    "kms": 67000,
    "price": 26500,
    "location": "Hamilton",
    "description": "Sporty turbo hatch. Apple CarPlay, reversing camera, lane keep assist.",
    "photos": ["https://images.unsplash.com/photo-1606611013016-969c19ba27bb?w=800"],
    "sellerContact": { "email": "dave.r@example.com" },
    "createdAt": "2026-03-15T08:00:00Z"
  },
  {
    "id": "rav4-2020-wgtn",
    "make": "Toyota",
    "model": "RAV4 GXL Hybrid",
    "year": 2020,
    "kms": 55000,
    "price": 45000,
    "location": "Wellington",
    "description": "Hybrid efficiency with SUV practicality. Immaculate condition inside and out.",
    "photos": ["https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=800"],
    "sellerContact": { "email": "emma.k@example.com", "phone": "027 567 8901" },
    "createdAt": "2026-03-14T13:00:00Z"
  },
  {
    "id": "ranger-2018-rot",
    "make": "Ford",
    "model": "Ranger XLT",
    "year": 2018,
    "kms": 125000,
    "price": 35000,
    "location": "Rotorua",
    "description": "Tough ute, runs like a dream. New tyres, recent service.",
    "photos": ["https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800"],
    "sellerContact": { "email": "forestrybloke@example.com", "phone": "021 678 9012" },
    "createdAt": "2026-03-13T10:00:00Z"
  },
  {
    "id": "golf-2020-akl",
    "make": "Volkswagen",
    "model": "Golf TSI",
    "year": 2020,
    "kms": 38000,
    "price": 32000,
    "location": "Auckland",
    "description": "German engineering, fantastic drive. Digital cockpit, ACC, park assist.",
    "photos": ["https://images.unsplash.com/photo-1471444928139-48c5bf5173f8?w=800"],
    "sellerContact": { "email": "hans.m@example.com", "phone": "022 789 0123" },
    "createdAt": "2026-03-12T15:30:00Z"
  },
  {
    "id": "aqua-2017-wgtn",
    "make": "Toyota",
    "model": "Aqua",
    "year": 2017,
    "kms": 78000,
    "price": 12500,
    "location": "Wellington",
    "description": "Ultimate fuel sipper. Perfect for city commute. Hybrid battery in great health.",
    "photos": ["https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800"],
    "sellerContact": { "email": "penny.s@example.com" },
    "createdAt": "2026-03-11T09:00:00Z"
  },
  {
    "id": "outback-2019-dun",
    "make": "Subaru",
    "model": "Outback Premium",
    "year": 2019,
    "kms": 82000,
    "price": 33000,
    "location": "Dunedin",
    "description": "AWD wagon, perfect for South Island adventures. EyeSight safety suite.",
    "photos": ["https://images.unsplash.com/photo-1619405399517-d7fce0f13302?w=800"],
    "sellerContact": { "email": "southerndriver@example.com", "phone": "027 890 1234" },
    "createdAt": "2026-03-10T12:00:00Z"
  },
  {
    "id": "demio-2018-akl",
    "make": "Mazda",
    "model": "Demio",
    "year": 2018,
    "kms": 52000,
    "price": 14000,
    "location": "Auckland",
    "description": "Zippy little hatch, great on gas. Perfect first car or city runabout.",
    "photos": ["https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800"],
    "sellerContact": { "email": "student.seller@example.com" },
    "createdAt": "2026-03-09T14:00:00Z"
  },
  {
    "id": "leaf-2019-wgtn",
    "make": "Nissan",
    "model": "Leaf 40kWh",
    "year": 2019,
    "kms": 45000,
    "price": 28000,
    "location": "Wellington",
    "description": "Full electric, 250km range. Home charger included in sale. Battery health 94%.",
    "photos": ["https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800"],
    "sellerContact": { "email": "ev.convert@example.com", "phone": "021 901 2345" },
    "createdAt": "2026-03-08T11:00:00Z"
  },
  {
    "id": "xtrail-2018-tau",
    "make": "Nissan",
    "model": "X-Trail ST-L",
    "year": 2018,
    "kms": 98000,
    "price": 24500,
    "location": "Tauranga",
    "description": "7-seater family SUV. Third row perfect for kids. Roof rails and tow bar.",
    "photos": ["https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800"],
    "sellerContact": { "email": "familyoftwo@example.com", "phone": "027 012 3456" },
    "createdAt": "2026-03-07T16:00:00Z"
  },
  {
    "id": "yaris-2021-akl",
    "make": "Toyota",
    "model": "Yaris Cross GX",
    "year": 2021,
    "kms": 22000,
    "price": 31000,
    "location": "Auckland",
    "description": "Brand new shape, still under warranty. Hybrid efficiency in a small SUV package.",
    "photos": ["https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800"],
    "sellerContact": { "email": "upgrading@example.com", "phone": "022 123 4567" },
    "createdAt": "2026-03-06T10:30:00Z"
  },
  {
    "id": "impreza-2017-wgtn",
    "make": "Subaru",
    "model": "Impreza Sport",
    "year": 2017,
    "kms": 88000,
    "price": 18500,
    "location": "Wellington",
    "description": "AWD hatch, handles Wellington hills like a champ. Recent cam belt service.",
    "photos": ["https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800"],
    "sellerContact": { "email": "hillclimber@example.com" },
    "createdAt": "2026-03-05T09:00:00Z"
  },
  {
    "id": "crv-2020-chch",
    "make": "Honda",
    "model": "CR-V VTi-S",
    "year": 2020,
    "kms": 48000,
    "price": 38000,
    "location": "Christchurch",
    "description": "Spacious SUV with Honda reliability. Sensing safety suite, panoramic roof.",
    "photos": ["https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800"],
    "sellerContact": { "email": "chch.seller@example.com", "phone": "021 234 5678" },
    "createdAt": "2026-03-04T14:00:00Z"
  },
  {
    "id": "fit-2018-akl",
    "make": "Honda",
    "model": "Fit Hybrid",
    "year": 2018,
    "kms": 62000,
    "price": 15500,
    "location": "Auckland",
    "description": "Magic seats make this small car super versatile. Excellent fuel economy.",
    "photos": ["https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800"],
    "sellerContact": { "email": "practical.choice@example.com" },
    "createdAt": "2026-03-03T11:00:00Z"
  },
  {
    "id": "model3-2021-wgtn",
    "make": "Tesla",
    "model": "Model 3 Long Range",
    "year": 2021,
    "kms": 35000,
    "price": 55000,
    "location": "Wellington",
    "description": "The future is here. Autopilot, 500km+ range, supercharger network access.",
    "photos": ["https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800"],
    "sellerContact": { "email": "techbro@example.com", "phone": "027 345 6789" },
    "createdAt": "2026-03-02T16:00:00Z"
  },
  {
    "id": "navara-2017-palm",
    "make": "Nissan",
    "model": "Navara ST-X",
    "year": 2017,
    "kms": 135000,
    "price": 28000,
    "location": "Palmerston North",
    "description": "Work-ready ute with all the comfort. Leather, sat nav, diff lock.",
    "photos": ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800"],
    "sellerContact": { "email": "farmhand@example.com", "phone": "021 456 7890" },
    "createdAt": "2026-03-01T08:00:00Z"
  }
]
```

### Step 1.2: Create listings data access module

- [ ] Create `src/lib/listings.ts`:

```typescript
import listingsData from '../data/listings.json';

export interface Listing {
  id: string;
  make: string;
  model: string;
  year: number;
  kms: number;
  price: number;
  location: string;
  description: string;
  photos: string[];
  sellerContact: {
    email: string;
    phone?: string;
  };
  createdAt: string;
}

const listings: Listing[] = listingsData as Listing[];

export function getAllListings(): Listing[] {
  return listings;
}

export function getListingById(id: string): Listing | undefined {
  return listings.find(l => l.id === id);
}

export interface FilterOptions {
  location?: string;
  maxPrice?: number;
  minPrice?: number;
  make?: string;
}

export function filterListings(options: FilterOptions): Listing[] {
  return listings.filter(listing => {
    if (options.location && listing.location.toLowerCase() !== options.location.toLowerCase()) {
      return false;
    }
    if (options.maxPrice && listing.price > options.maxPrice) {
      return false;
    }
    if (options.minPrice && listing.price < options.minPrice) {
      return false;
    }
    if (options.make && listing.make.toLowerCase() !== options.make.toLowerCase()) {
      return false;
    }
    return true;
  });
}

export function getFeaturedListings(count: number = 6): Listing[] {
  return listings.slice(0, count);
}

export function addListing(listing: Omit<Listing, 'id' | 'createdAt'>): Listing {
  const newListing: Listing = {
    ...listing,
    id: `${listing.make.toLowerCase()}-${listing.year}-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  listings.unshift(newListing);
  return newListing;
}
```

### Step 1.3: Commit data layer

- [ ] Run: `git add src/data/listings.json src/lib/listings.ts && git commit -m "feat: add listings data layer with seed data"`

---

## Task 2: Layout Component

**Files:**
- Create: `src/components/Layout.astro`

### Step 2.1: Create base layout

- [ ] Create `src/components/Layout.astro`:

```astro
---
interface Props {
  title: string;
  description?: string;
}

const { title, description = "The AI-native car marketplace for New Zealand" } = Astro.props;
const siteUrl = "https://garage.co.nz";
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content={description} />
    <title>{title} | garage.co.nz</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />

    <script type="application/ld+json" set:html={JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "garage.co.nz",
      "url": siteUrl,
      "description": "The AI-native car marketplace for New Zealand",
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${siteUrl}/cars?q={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    })} />
  </head>
  <body>
    <header>
      <nav>
        <a href="/" class="logo">garage.co.nz</a>
        <div class="nav-links">
          <a href="/cars">Browse Cars</a>
          <a href="/sell">Sell Your Car</a>
        </div>
      </nav>
    </header>

    <main>
      <slot />
    </main>

    <footer>
      <p>garage.co.nz — The AI-native car marketplace</p>
      <p><a href="/llms.txt">For AI agents</a></p>
    </footer>
  </body>
</html>

<style>
  :root {
    --bg: #0a0a0a;
    --fg: #fafafa;
    --accent: #10b981;
    --muted: #737373;
    --border: #262626;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html {
    font-family: system-ui, -apple-system, sans-serif;
    background: var(--bg);
    color: var(--fg);
  }

  body {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  header {
    border-bottom: 1px solid var(--border);
    padding: 1rem 2rem;
  }

  nav {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .logo {
    font-weight: 700;
    font-size: 1.25rem;
    color: var(--fg);
    text-decoration: none;
  }

  .nav-links {
    display: flex;
    gap: 2rem;
  }

  .nav-links a {
    color: var(--muted);
    text-decoration: none;
    transition: color 0.2s;
  }

  .nav-links a:hover {
    color: var(--fg);
  }

  main {
    flex: 1;
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    width: 100%;
  }

  footer {
    border-top: 1px solid var(--border);
    padding: 2rem;
    text-align: center;
    color: var(--muted);
    font-size: 0.875rem;
  }

  footer a {
    color: var(--muted);
  }
</style>
```

### Step 2.2: Commit layout

- [ ] Run: `git add src/components/Layout.astro && git commit -m "feat: add base layout component with site JSON-LD"`

---

## Task 3: Listing Card Component

**Files:**
- Create: `src/components/ListingCard.astro`

### Step 3.1: Create listing card

- [ ] Create `src/components/ListingCard.astro`:

```astro
---
import type { Listing } from '../lib/listings';

interface Props {
  listing: Listing;
}

const { listing } = Astro.props;
const displayPrice = listing.price.toLocaleString('en-NZ');
---

<article class="card">
  <a href={`/cars/${listing.id}`}>
    <img src={listing.photos[0]} alt={`${listing.year} ${listing.make} ${listing.model}`} loading="lazy" />
    <div class="content">
      <h3>{listing.year} {listing.make} {listing.model}</h3>
      <p class="price">${displayPrice}</p>
      <p class="meta">{listing.kms.toLocaleString()} km · {listing.location}</p>
    </div>
  </a>
</article>

<style>
  .card {
    background: #171717;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #262626;
    transition: border-color 0.2s, transform 0.2s;
  }

  .card:hover {
    border-color: #10b981;
    transform: translateY(-2px);
  }

  .card a {
    text-decoration: none;
    color: inherit;
  }

  .card img {
    width: 100%;
    aspect-ratio: 16/10;
    object-fit: cover;
  }

  .content {
    padding: 1rem;
  }

  h3 {
    font-size: 1.125rem;
    margin-bottom: 0.5rem;
    color: #fafafa;
  }

  .price {
    font-size: 1.25rem;
    font-weight: 700;
    color: #10b981;
    margin-bottom: 0.25rem;
  }

  .meta {
    font-size: 0.875rem;
    color: #737373;
  }
</style>
```

### Step 3.2: Commit card component

- [ ] Run: `git add src/components/ListingCard.astro && git commit -m "feat: add listing card component"`

---

## Task 4: Landing Page

**Files:**
- Modify: `src/pages/index.astro` (replace Pac-Man game)

### Step 4.1: Replace landing page

- [ ] Replace entire contents of `src/pages/index.astro`:

```astro
---
import Layout from '../components/Layout.astro';
import ListingCard from '../components/ListingCard.astro';
import { getFeaturedListings } from '../lib/listings';

const featured = getFeaturedListings(6);
---

<Layout title="The AI-Native Car Marketplace">
  <section class="hero">
    <h1>Buy and sell cars with your AI</h1>
    <p class="tagline">The marketplace designed for ChatGPT, Claude, and the AI assistants you already use.</p>

    <div class="prompt-box">
      <p class="prompt-label">Copy this into ChatGPT:</p>
      <code class="prompt">"Find me a reliable car under $20,000 in Wellington on garage.co.nz"</code>
      <button class="copy-btn" onclick="navigator.clipboard.writeText('Find me a reliable car under $20,000 in Wellington on garage.co.nz')">Copy</button>
    </div>
  </section>

  <section class="how-it-works">
    <h2>How it works</h2>
    <div class="steps">
      <div class="step">
        <span class="step-num">1</span>
        <h3>Ask your AI</h3>
        <p>Tell ChatGPT what kind of car you want. It browses our listings for you.</p>
      </div>
      <div class="step">
        <span class="step-num">2</span>
        <h3>Get matched</h3>
        <p>Your AI finds cars that match your criteria and shows you the best options.</p>
      </div>
      <div class="step">
        <span class="step-num">3</span>
        <h3>Contact seller</h3>
        <p>Your AI helps you reach out. Meet up, inspect, and drive away.</p>
      </div>
    </div>
  </section>

  <section class="featured">
    <h2>Featured listings</h2>
    <div class="grid">
      {featured.map(listing => (
        <ListingCard listing={listing} />
      ))}
    </div>
    <a href="/cars" class="view-all">View all cars →</a>
  </section>

  <section class="sell-cta">
    <h2>Selling a car?</h2>
    <p>List it in 2 minutes. Free, no fees.</p>
    <a href="/sell" class="btn">List your car</a>
  </section>
</Layout>

<style>
  .hero {
    text-align: center;
    padding: 4rem 0;
  }

  h1 {
    font-size: 3rem;
    font-weight: 700;
    margin-bottom: 1rem;
    background: linear-gradient(to right, #10b981, #3b82f6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .tagline {
    font-size: 1.25rem;
    color: #a3a3a3;
    margin-bottom: 3rem;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
  }

  .prompt-box {
    background: #171717;
    border: 1px solid #262626;
    border-radius: 12px;
    padding: 1.5rem;
    max-width: 600px;
    margin: 0 auto;
  }

  .prompt-label {
    font-size: 0.875rem;
    color: #737373;
    margin-bottom: 0.75rem;
  }

  .prompt {
    display: block;
    font-size: 1rem;
    color: #10b981;
    margin-bottom: 1rem;
  }

  .copy-btn {
    background: #10b981;
    color: #000;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  .copy-btn:hover {
    opacity: 0.9;
  }

  .how-it-works {
    padding: 4rem 0;
    border-top: 1px solid #262626;
  }

  .how-it-works h2 {
    text-align: center;
    font-size: 1.5rem;
    margin-bottom: 3rem;
  }

  .steps {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
  }

  .step {
    text-align: center;
  }

  .step-num {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    background: #10b981;
    color: #000;
    font-weight: 700;
    border-radius: 50%;
    margin-bottom: 1rem;
  }

  .step h3 {
    margin-bottom: 0.5rem;
  }

  .step p {
    color: #737373;
    font-size: 0.9375rem;
  }

  .featured {
    padding: 4rem 0;
    border-top: 1px solid #262626;
  }

  .featured h2 {
    font-size: 1.5rem;
    margin-bottom: 2rem;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .view-all {
    display: inline-block;
    color: #10b981;
    text-decoration: none;
    font-weight: 500;
  }

  .view-all:hover {
    text-decoration: underline;
  }

  .sell-cta {
    text-align: center;
    padding: 4rem 2rem;
    background: #171717;
    border-radius: 16px;
    margin-top: 2rem;
  }

  .sell-cta h2 {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }

  .sell-cta p {
    color: #737373;
    margin-bottom: 1.5rem;
  }

  .btn {
    display: inline-block;
    background: #10b981;
    color: #000;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    text-decoration: none;
    transition: opacity 0.2s;
  }

  .btn:hover {
    opacity: 0.9;
  }
</style>
```

### Step 4.2: Commit landing page

- [ ] Run: `git add src/pages/index.astro && git commit -m "feat: replace Pac-Man with marketplace landing page"`

---

## Task 5: Cars Listing Page

**Files:**
- Create: `src/pages/cars/index.astro`

### Step 5.1: Create listings page with query param filtering

- [ ] Create `src/pages/cars/index.astro`:

```astro
---
import Layout from '../../components/Layout.astro';
import ListingCard from '../../components/ListingCard.astro';
import { getAllListings, filterListings, type FilterOptions } from '../../lib/listings';

const url = new URL(Astro.request.url);
const location = url.searchParams.get('location');
const maxPrice = url.searchParams.get('maxPrice');
const minPrice = url.searchParams.get('minPrice');
const make = url.searchParams.get('make');

const filterOptions: FilterOptions = {};
if (location) filterOptions.location = location;
if (maxPrice) filterOptions.maxPrice = parseInt(maxPrice);
if (minPrice) filterOptions.minPrice = parseInt(minPrice);
if (make) filterOptions.make = make;

const hasFilters = Object.keys(filterOptions).length > 0;
const listings = hasFilters ? filterListings(filterOptions) : getAllListings();

const description = hasFilters
  ? `${listings.length} cars found matching your criteria`
  : `Browse ${listings.length} cars for sale in New Zealand`;
---

<Layout title="Browse Cars" description={description}>
  <section class="listings-page">
    <header class="page-header">
      <h1>Cars for sale</h1>
      <p class="count">{listings.length} listings{hasFilters ? ' (filtered)' : ''}</p>
    </header>

    {hasFilters && (
      <div class="filters-active">
        <span>Filters: </span>
        {location && <span class="filter-tag">Location: {location}</span>}
        {make && <span class="filter-tag">Make: {make}</span>}
        {maxPrice && <span class="filter-tag">Max: ${parseInt(maxPrice).toLocaleString()}</span>}
        {minPrice && <span class="filter-tag">Min: ${parseInt(minPrice).toLocaleString()}</span>}
        <a href="/cars" class="clear-filters">Clear all</a>
      </div>
    )}

    {listings.length > 0 ? (
      <div class="grid">
        {listings.map(listing => (
          <ListingCard listing={listing} />
        ))}
      </div>
    ) : (
      <div class="no-results">
        <p>No cars match your filters.</p>
        <a href="/cars">View all cars</a>
      </div>
    )}
  </section>
</Layout>

<style>
  .page-header {
    margin-bottom: 2rem;
  }

  h1 {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }

  .count {
    color: #737373;
  }

  .filters-active {
    background: #171717;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 2rem;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: #737373;
  }

  .filter-tag {
    background: #262626;
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    color: #fafafa;
  }

  .clear-filters {
    color: #10b981;
    margin-left: auto;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  .no-results {
    text-align: center;
    padding: 4rem;
    color: #737373;
  }

  .no-results a {
    color: #10b981;
    display: inline-block;
    margin-top: 1rem;
  }
</style>
```

### Step 5.2: Commit listings page

- [ ] Run: `mkdir -p src/pages/cars && git add src/pages/cars/index.astro && git commit -m "feat: add /cars listing page with query param filtering"`

---

## Task 6: Car Detail Page with JSON-LD

**Files:**
- Create: `src/pages/cars/[id].astro`

### Step 6.1: Create detail page

- [ ] Create `src/pages/cars/[id].astro`:

```astro
---
import Layout from '../../components/Layout.astro';
import { getListingById } from '../../lib/listings';

const { id } = Astro.params;
const listing = getListingById(id!);

if (!listing) {
  return Astro.redirect('/cars');
}

const displayPrice = listing.price.toLocaleString('en-NZ');
const displayKms = listing.kms.toLocaleString();
const title = `${listing.year} ${listing.make} ${listing.model}`;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Car",
  "name": title,
  "brand": {
    "@type": "Brand",
    "name": listing.make
  },
  "model": listing.model,
  "vehicleModelDate": listing.year.toString(),
  "mileageFromOdometer": {
    "@type": "QuantitativeValue",
    "value": listing.kms,
    "unitCode": "KMT"
  },
  "offers": {
    "@type": "Offer",
    "price": listing.price,
    "priceCurrency": "NZD",
    "availability": "https://schema.org/InStock",
    "seller": {
      "@type": "Person",
      "email": listing.sellerContact.email,
      ...(listing.sellerContact.phone && { "telephone": listing.sellerContact.phone })
    }
  },
  "image": listing.photos,
  "description": listing.description,
  "vehicleConfiguration": listing.location
};
---

<Layout title={title} description={`${title} for sale in ${listing.location} - $${displayPrice}`}>
  <script type="application/ld+json" set:html={JSON.stringify(jsonLd)} />

  <article class="listing-detail">
    <a href="/cars" class="back-link">← Back to listings</a>

    <div class="gallery">
      <img src={listing.photos[0]} alt={title} />
    </div>

    <div class="content">
      <header>
        <h1>{title}</h1>
        <p class="price">${displayPrice}</p>
      </header>

      <dl class="specs">
        <div class="spec">
          <dt>Year</dt>
          <dd>{listing.year}</dd>
        </div>
        <div class="spec">
          <dt>Kilometers</dt>
          <dd>{displayKms} km</dd>
        </div>
        <div class="spec">
          <dt>Location</dt>
          <dd>{listing.location}</dd>
        </div>
        <div class="spec">
          <dt>Listed</dt>
          <dd>{new Date(listing.createdAt).toLocaleDateString('en-NZ')}</dd>
        </div>
      </dl>

      <section class="description">
        <h2>Description</h2>
        <p>{listing.description}</p>
      </section>

      <section class="contact">
        <h2>Contact seller</h2>
        <div class="contact-info">
          <a href={`mailto:${listing.sellerContact.email}`} class="contact-btn email">
            Email seller
          </a>
          {listing.sellerContact.phone && (
            <a href={`tel:${listing.sellerContact.phone}`} class="contact-btn phone">
              {listing.sellerContact.phone}
            </a>
          )}
        </div>
      </section>
    </div>
  </article>
</Layout>

<style>
  .back-link {
    display: inline-block;
    color: #737373;
    text-decoration: none;
    margin-bottom: 1.5rem;
  }

  .back-link:hover {
    color: #fafafa;
  }

  .listing-detail {
    max-width: 900px;
  }

  .gallery img {
    width: 100%;
    aspect-ratio: 16/9;
    object-fit: cover;
    border-radius: 12px;
    margin-bottom: 2rem;
  }

  header {
    margin-bottom: 2rem;
  }

  h1 {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }

  .price {
    font-size: 1.75rem;
    font-weight: 700;
    color: #10b981;
  }

  .specs {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
    background: #171717;
    padding: 1.5rem;
    border-radius: 12px;
    margin-bottom: 2rem;
  }

  .spec dt {
    font-size: 0.875rem;
    color: #737373;
    margin-bottom: 0.25rem;
  }

  .spec dd {
    font-weight: 600;
  }

  .description, .contact {
    margin-bottom: 2rem;
  }

  h2 {
    font-size: 1.25rem;
    margin-bottom: 1rem;
  }

  .description p {
    color: #a3a3a3;
    line-height: 1.6;
  }

  .contact-info {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .contact-btn {
    display: inline-flex;
    align-items: center;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    text-decoration: none;
    transition: opacity 0.2s;
  }

  .contact-btn.email {
    background: #10b981;
    color: #000;
  }

  .contact-btn.phone {
    background: #262626;
    color: #fafafa;
    border: 1px solid #404040;
  }

  .contact-btn:hover {
    opacity: 0.9;
  }
</style>
```

### Step 6.2: Commit detail page

- [ ] Run: `git add src/pages/cars/[id].astro && git commit -m "feat: add car detail page with schema.org JSON-LD"`

---

## Task 7: Sell Page

**Files:**
- Create: `src/pages/sell.astro`
- Create: `src/pages/api/listings.ts`

### Step 7.1: Create sell form page

- [ ] Create `src/pages/sell.astro`:

```astro
---
import Layout from '../components/Layout.astro';
---

<Layout title="Sell Your Car">
  <section class="sell-page">
    <header>
      <h1>List your car</h1>
      <p>Free to list. No fees. Reach buyers using AI assistants.</p>
    </header>

    <form id="sell-form" class="listing-form">
      <div class="form-section">
        <h2>Vehicle details</h2>

        <div class="form-row">
          <div class="form-group">
            <label for="make">Make</label>
            <input type="text" id="make" name="make" required placeholder="e.g. Toyota" />
          </div>
          <div class="form-group">
            <label for="model">Model</label>
            <input type="text" id="model" name="model" required placeholder="e.g. Corolla" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="year">Year</label>
            <input type="number" id="year" name="year" required min="1980" max="2026" placeholder="2020" />
          </div>
          <div class="form-group">
            <label for="kms">Kilometers</label>
            <input type="number" id="kms" name="kms" required min="0" placeholder="50000" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="price">Price (NZD)</label>
            <input type="number" id="price" name="price" required min="0" placeholder="25000" />
          </div>
          <div class="form-group">
            <label for="location">Location</label>
            <input type="text" id="location" name="location" required placeholder="e.g. Wellington" />
          </div>
        </div>
      </div>

      <div class="form-section">
        <h2>Description</h2>
        <div class="form-group">
          <label for="description">Tell buyers about your car</label>
          <textarea id="description" name="description" required rows="4" placeholder="Service history, condition, features..."></textarea>
        </div>
      </div>

      <div class="form-section">
        <h2>Photos</h2>
        <div class="form-group">
          <label for="photo">Photo URL</label>
          <input type="url" id="photo" name="photo" placeholder="https://..." />
          <p class="hint">Paste a link to a photo of your car</p>
        </div>
      </div>

      <div class="form-section">
        <h2>Contact details</h2>
        <div class="form-row">
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required placeholder="you@example.com" />
          </div>
          <div class="form-group">
            <label for="phone">Phone (optional)</label>
            <input type="tel" id="phone" name="phone" placeholder="021 123 4567" />
          </div>
        </div>
      </div>

      <button type="submit" class="submit-btn">List my car</button>
    </form>

    <div id="success" class="success-message" hidden>
      <h2>Car listed!</h2>
      <p>Your listing is now live.</p>
      <a href="/cars" class="view-btn">View all listings</a>
    </div>
  </section>
</Layout>

<script>
  const form = document.getElementById('sell-form') as HTMLFormElement;
  const success = document.getElementById('success') as HTMLDivElement;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const data = {
      make: formData.get('make'),
      model: formData.get('model'),
      year: parseInt(formData.get('year') as string),
      kms: parseInt(formData.get('kms') as string),
      price: parseInt(formData.get('price') as string),
      location: formData.get('location'),
      description: formData.get('description'),
      photos: formData.get('photo') ? [formData.get('photo')] : [],
      sellerContact: {
        email: formData.get('email'),
        phone: formData.get('phone') || undefined
      }
    };

    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        form.hidden = true;
        success.hidden = false;
      }
    } catch (err) {
      console.error(err);
    }
  });
</script>

<style>
  .sell-page {
    max-width: 700px;
    margin: 0 auto;
  }

  header {
    margin-bottom: 2rem;
  }

  h1 {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }

  header p {
    color: #737373;
  }

  .listing-form {
    background: #171717;
    border: 1px solid #262626;
    border-radius: 16px;
    padding: 2rem;
  }

  .form-section {
    margin-bottom: 2rem;
  }

  .form-section h2 {
    font-size: 1.125rem;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #262626;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  @media (max-width: 600px) {
    .form-row {
      grid-template-columns: 1fr;
    }
  }

  .form-group {
    margin-bottom: 1rem;
  }

  label {
    display: block;
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
    color: #a3a3a3;
  }

  input, textarea {
    width: 100%;
    padding: 0.75rem;
    background: #0a0a0a;
    border: 1px solid #262626;
    border-radius: 8px;
    color: #fafafa;
    font-size: 1rem;
    font-family: inherit;
  }

  input:focus, textarea:focus {
    outline: none;
    border-color: #10b981;
  }

  .hint {
    font-size: 0.75rem;
    color: #737373;
    margin-top: 0.5rem;
  }

  .submit-btn {
    width: 100%;
    padding: 1rem;
    background: #10b981;
    color: #000;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  .submit-btn:hover {
    opacity: 0.9;
  }

  .success-message {
    text-align: center;
    padding: 4rem 2rem;
    background: #171717;
    border-radius: 16px;
  }

  .success-message h2 {
    color: #10b981;
    margin-bottom: 0.5rem;
  }

  .success-message p {
    color: #737373;
    margin-bottom: 1.5rem;
  }

  .view-btn {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    background: #262626;
    color: #fafafa;
    border-radius: 8px;
    text-decoration: none;
  }
</style>
```

### Step 7.2: Create API endpoint

- [ ] Create `src/pages/api/listings.ts`:

```typescript
import type { APIRoute } from 'astro';
import { addListing } from '../../lib/listings';

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();

    // Basic validation
    if (!data.make || !data.model || !data.year || !data.price || !data.location || !data.description || !data.sellerContact?.email) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const listing = addListing(data);

    return new Response(JSON.stringify({ success: true, listing }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to create listing' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

### Step 7.3: Commit sell page and API

- [ ] Run: `git add src/pages/sell.astro src/pages/api/listings.ts && git commit -m "feat: add sell form and listings API endpoint"`

---

## Task 8: llms.txt

**Files:**
- Create: `public/llms.txt`

### Step 8.1: Create llms.txt

- [ ] Create `public/llms.txt`:

```
# garage.co.nz - AI-First Car Marketplace

> This site is designed for AI agents. The HTML is semantic, the data is structured, and you're welcome here.

## What This Site Does
Connects car buyers and sellers in New Zealand. Transactions happen offline - we just help people find each other.

## How to Browse

### All listings
GET /cars

Returns a page with all car listings. Each listing card shows: make, model, year, price, location.

### Filter listings
Add query params to /cars:
- /cars?location=Wellington - filter by city
- /cars?maxPrice=20000 - maximum price in NZD
- /cars?minPrice=10000 - minimum price in NZD
- /cars?make=Toyota - filter by manufacturer

Combine filters: /cars?location=Auckland&maxPrice=25000&make=Honda

### Single listing
GET /cars/[id]

Full details with JSON-LD structured data (schema.org/Car). Includes seller contact info.

## Structured Data
Every listing page includes JSON-LD with:
- @type: Car
- brand, model, vehicleModelDate
- mileageFromOdometer
- offers (price, seller contact)
- description, images

## Helping Users

### Finding a car
1. Ask what they're looking for (budget, location, needs)
2. Browse /cars with appropriate filters
3. Present options with key details
4. Help them contact the seller

### Contacting sellers
Each listing has seller email (and sometimes phone). Help users compose a message or call.

### Listing a car
Direct sellers to /sell - it's a simple form, no account required.

## Rate Limits
None currently. Please be reasonable.

## Questions?
This is a new site. If something doesn't work for agents, let us know.
```

### Step 8.2: Commit llms.txt

- [ ] Run: `git add public/llms.txt && git commit -m "feat: add llms.txt with agent instructions"`

---

## Task 9: Final Testing

### Step 9.1: Start dev server and verify

- [ ] Run: `npm run dev`
- [ ] Verify in browser:
  - Landing page loads at http://localhost:4500
  - Featured listings appear
  - /cars shows all 20 listings
  - /cars?location=Wellington filters correctly
  - /cars/corolla-2018-wgtn shows detail with JSON-LD (check page source)
  - /sell form works (submits to API)
  - /llms.txt serves plain text

### Step 9.2: Final commit

- [ ] Run: `git status` to check for any uncommitted changes
- [ ] If clean: Done!
