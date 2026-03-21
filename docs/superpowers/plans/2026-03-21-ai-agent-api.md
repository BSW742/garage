# AI Agent API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add JSON API endpoints so AI agents can query garage.co.nz directly without web browsing.

**Architecture:** Two new API endpoints (`/api/cars` and `/api/cars/[id]`) that return JSON. Uses existing D1 database functions from `src/lib/listings.ts`. Update llms.txt with API documentation.

**Tech Stack:** Astro API routes, Cloudflare D1, TypeScript

---

### Task 1: Create GET /api/cars endpoint

**Files:**
- Create: `src/pages/api/cars/index.ts`

- [ ] **Step 1: Create the API endpoint file**

```typescript
import type { APIRoute } from 'astro';
import { getAllListings, filterListings, type FilterOptions, type Listing } from '../../../lib/listings';

interface Runtime {
  env: {
    DB: D1Database;
  };
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T = unknown>(): Promise<{ results: T[]; success: boolean }>;
  first<T = unknown>(): Promise<T | null>;
}

function formatListingForApi(listing: Listing) {
  return {
    id: listing.id,
    make: listing.make,
    model: listing.model,
    year: listing.year,
    price: listing.price,
    kms: listing.kms,
    location: listing.location,
    photo: listing.photos[0] || null,
    url: `https://garage.co.nz/cars/${listing.id}`,
  };
}

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const { DB } = (locals as { runtime: Runtime }).runtime.env;

    const maxPrice = url.searchParams.get('maxPrice');
    const minPrice = url.searchParams.get('minPrice');
    const location = url.searchParams.get('location');
    const make = url.searchParams.get('make');
    const limit = url.searchParams.get('limit');

    const hasFilters = maxPrice || minPrice || location || make;

    let listings: Listing[];
    if (hasFilters) {
      const options: FilterOptions = {};
      if (maxPrice) options.maxPrice = parseInt(maxPrice);
      if (minPrice) options.minPrice = parseInt(minPrice);
      if (location) options.location = location;
      if (make) options.make = make;
      listings = await filterListings(DB, options);
    } else {
      listings = await getAllListings(DB);
    }

    if (limit) {
      listings = listings.slice(0, parseInt(limit));
    }

    return new Response(JSON.stringify({
      count: listings.length,
      listings: listings.map(formatListingForApi),
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch listings' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
```

- [ ] **Step 2: Test locally**

Run: `curl -s http://localhost:4500/api/cars | head -20`
Expected: JSON with `count` and `listings` array

Run: `curl -s "http://localhost:4500/api/cars?maxPrice=20000" | head -20`
Expected: JSON with filtered listings under $20k

- [ ] **Step 3: Commit**

```bash
git add src/pages/api/cars/index.ts
git commit -m "feat: add GET /api/cars endpoint for AI agents"
```

---

### Task 2: Create GET /api/cars/[id] endpoint

**Files:**
- Create: `src/pages/api/cars/[id].ts`

- [ ] **Step 1: Create the single listing endpoint**

```typescript
import type { APIRoute } from 'astro';
import { getListingById } from '../../../lib/listings';

interface Runtime {
  env: {
    DB: D1Database;
  };
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
}

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const { DB } = (locals as { runtime: Runtime }).runtime.env;
    const { id } = params;

    if (!id) {
      return new Response(JSON.stringify({ error: 'Listing ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const listing = await getListingById(DB, id);

    if (!listing) {
      return new Response(JSON.stringify({ error: 'Listing not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      id: listing.id,
      make: listing.make,
      model: listing.model,
      year: listing.year,
      price: listing.price,
      kms: listing.kms,
      location: listing.location,
      description: listing.description,
      photos: listing.photos,
      seller: {
        email: listing.sellerContact.email,
        phone: listing.sellerContact.phone || null,
      },
      url: `https://garage.co.nz/cars/${listing.id}`,
      listedAt: listing.createdAt,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch listing' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
```

- [ ] **Step 2: Test locally**

Run: `curl -s http://localhost:4500/api/cars/audi-2014-1774063504667`
Expected: JSON with full listing details including description, photos, seller

Run: `curl -s http://localhost:4500/api/cars/nonexistent`
Expected: `{"error":"Listing not found"}` with 404 status

- [ ] **Step 3: Commit**

```bash
git add src/pages/api/cars/[id].ts
git commit -m "feat: add GET /api/cars/[id] endpoint for AI agents"
```

---

### Task 3: Update llms.txt with API documentation

**Files:**
- Modify: `public/llms.txt`

- [ ] **Step 1: Update llms.txt**

Add new section at the top, after the intro:

```markdown
## API Access (Recommended for AI Agents)

Don't scrape HTML. Use the JSON API directly:

### Search all listings
GET https://garage.co.nz/api/cars

### Search with filters
GET https://garage.co.nz/api/cars?maxPrice=20000&location=Auckland

Query parameters:
- maxPrice - Maximum price in NZD
- minPrice - Minimum price in NZD
- location - City name (Auckland, Wellington, Christchurch, etc.)
- make - Car manufacturer (Toyota, Mazda, Honda, etc.)
- limit - Maximum number of results

### Get single listing
GET https://garage.co.nz/api/cars/{id}

### Example queries

"Find cars under $15k":
GET https://garage.co.nz/api/cars?maxPrice=15000

"Toyota in Auckland":
GET https://garage.co.nz/api/cars?make=Toyota&location=Auckland

"Get specific listing":
GET https://garage.co.nz/api/cars/corolla-2018-wgtn

### Response format

Search returns:
```json
{
  "count": 5,
  "listings": [
    {
      "id": "corolla-2018-wgtn",
      "make": "Toyota",
      "model": "Corolla",
      "year": 2018,
      "price": 14500,
      "kms": 85000,
      "location": "Wellington",
      "photo": "https://...",
      "url": "https://garage.co.nz/cars/corolla-2018-wgtn"
    }
  ]
}
```

Single listing returns full details including description, all photos, and seller contact.
```

- [ ] **Step 2: Verify the file**

Run: `cat public/llms.txt | head -60`
Expected: New API section appears after intro

- [ ] **Step 3: Commit**

```bash
git add public/llms.txt
git commit -m "docs: add API documentation to llms.txt for AI agents"
```

---

### Task 4: Deploy and verify

**Files:**
- None (deployment)

- [ ] **Step 1: Build**

Run: `npm run build`
Expected: Build completes successfully

- [ ] **Step 2: Deploy**

Run: `npx wrangler pages deploy ./dist --commit-dirty=true`
Expected: Deployment successful

- [ ] **Step 3: Test production API**

Run: `curl -s https://garage.co.nz/api/cars | head -20`
Expected: JSON response with listings

Run: `curl -s "https://garage.co.nz/api/cars?maxPrice=20000&location=Auckland"`
Expected: Filtered JSON response

Run: `curl -s https://garage.co.nz/api/cars/audi-2014-1774063504667`
Expected: Full listing JSON

- [ ] **Step 4: Verify llms.txt**

Run: `curl -s https://garage.co.nz/llms.txt | grep -A5 "API Access"`
Expected: New API documentation section visible

- [ ] **Step 5: Commit and push**

```bash
git push origin main
```

---

## Success Criteria

- [ ] `GET /api/cars` returns JSON with all listings
- [ ] `GET /api/cars?maxPrice=20000` filters correctly
- [ ] `GET /api/cars/{id}` returns full listing details
- [ ] `GET /api/cars/nonexistent` returns 404
- [ ] llms.txt documents the API with examples
- [ ] AI agent can query API without web browsing
