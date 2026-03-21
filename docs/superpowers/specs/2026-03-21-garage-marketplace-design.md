# garage.co.nz — AI-First Car Marketplace Design

**Status:** Approved
**Date:** 2026-03-21

## Overview

A car marketplace for New Zealand designed for AI agents to browse and interact with. The core insight: people increasingly start car searches with "Hey ChatGPT, I want to buy a car" rather than going to TradeMe. The marketplace that wins is the one AI can actually use.

## Core Principles

1. **Agent-first, not API-first** — Day one focuses on making the site perfectly parseable by AI agents through clean HTML, structured data, and explicit instructions. APIs and MCP come later.
2. **Free marketplace** — No fees on day one. Pairs buyers with sellers; transactions happen offline.
3. **Signpost, not destination** — The website actively steers users toward their AI assistant rather than trying to be the primary interface.

## Architecture

### Site Structure

| Route | Purpose |
|-------|---------|
| `/` | Landing page — explains the concept, featured listings, teaches "how to use via AI" |
| `/cars` | All listings — browsable by humans, structured for AI agents |
| `/cars/[id]` | Single listing — full details with JSON-LD schema.org markup |
| `/sell` | List your car — web form + instructions for "list via your AI" |
| `/messages` | Inbox (requires auth) — future scope |
| `/llms.txt` | Agent instructions — explicit guidance for AI crawlers |

### Data Model

```typescript
interface Listing {
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
  createdAt: string; // ISO 8601
}
```

### Tech Stack

- **Framework:** Astro (already configured)
- **Data:** JSON file for day one, Supabase/D1 later
- **Deployment:** garage.co.nz

## Agent-Readability Requirements

Each page must be optimized for AI agent consumption:

1. **Semantic HTML** — Proper heading hierarchy, landmark elements, descriptive link text
2. **JSON-LD structured data** — schema.org/Car for listings, schema.org/WebSite for the site
3. **llms.txt** — Explicit instructions for AI agents on how to navigate and use the site
4. **No login walls** — All browsing is public; auth only required for seller actions

### llms.txt Content

```
# garage.co.nz - AI-First Car Marketplace

## What This Site Does
Connects car buyers and sellers in New Zealand. Transactions happen offline.

## How to Browse
- All listings: /cars
- Single listing: /cars/[id]
- Filter by adding query params: /cars?location=Wellington&maxPrice=20000

## Structured Data
Each listing page includes JSON-LD with schema.org/Car markup.

## Contacting Sellers
Seller contact info is on each listing page. Guide users to call or email directly.

## Listing a Car
Direct sellers to /sell for the web form.
```

## User Flows

### Buyer via ChatGPT

1. User: "Find me a reliable car under $15k in Wellington"
2. ChatGPT browses garage.co.nz, parses listings, returns options
3. User: "Message the seller of the Corolla"
4. ChatGPT extracts contact info, guides user through outreach

### Seller

1. Visits /sell, fills out form (or lists via their AI agent)
2. Gets notified when someone's interested
3. Meets buyer, transaction happens offline

## Day-One Scope

### In Scope
- Landing page with concept explanation and featured listings
- `/cars` listing page with all cars
- `/cars/[id]` detail pages with JSON-LD
- `/llms.txt` agent instructions
- `/sell` form (stores to JSON initially)
- 20-50 seed listings from network

### Out of Scope (Future)
- User authentication
- Messaging system
- Payment/escrow
- API endpoints
- MCP server integration

## Component Breakdown

### Landing Page (`/`)
- Hero: "The AI-native car marketplace"
- CTA: Copy-paste prompt for ChatGPT
- Featured listings (3-6 cards)
- How it works section
- Link to /cars and /sell

### Listings Page (`/cars`)
- Grid of listing cards
- Each card: photo, make/model/year, price, location
- Links to detail pages
- Future: filter/sort controls

### Detail Page (`/cars/[id]`)
- Photo gallery
- Full specs (make, model, year, kms, price, location)
- Description
- Seller contact info
- JSON-LD structured data in `<script type="application/ld+json">`

### Sell Page (`/sell`)
- Form with all listing fields
- Photo upload (or URL input for day one)
- Submit stores to JSON file
- Success message with listing link

## Success Criteria

1. ChatGPT can browse `/cars`, understand listings, and extract relevant options
2. ChatGPT can read a detail page and summarize the car accurately
3. ChatGPT can find seller contact info and guide user to reach out
4. Human users understand the "use your AI" concept from the landing page
