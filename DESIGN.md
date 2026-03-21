# garage.co.nz — AI-First Car Marketplace for NZ

**Status:** Design approved, ready for implementation
**Date:** 2026-03-21

## The Bet

People increasingly start with "Hey ChatGPT, I want to buy a car" instead of going to TradeMe. The marketplace that wins is the one AI can actually use.

## What Garage Does

- **Pairs buyers with sellers** — transaction happens offline (meet, inspect, pay, drive away)
- **Free** — no fees (day one)
- **Agent-first** — designed for AI agents to browse, search, and initiate contact

## What Garage Doesn't Do (Day One)

- Payment/escrow
- Complex API integrations
- MCP servers

## Core Strategy

**First wedge: Make the site so agent-browsable that when ChatGPT lands there, it just works.**

Not APIs. Not MCP. Just a beautifully structured site that agents love to read:
1. Clean, semantic HTML
2. Structured data (JSON-LD, schema.org)
3. llms.txt with explicit agent instructions
4. Fast, public pages (no login walls for browsing)

The API comes later. MCP comes later. Day-one is being excellent for agent browsing.

## User Flow

**Buyer (via ChatGPT mobile):**
1. "Find me a reliable car under $15k in Wellington"
2. ChatGPT browses garage.co.nz, parses listings, returns options
3. "Message the seller of the Corolla"
4. ChatGPT guides them through contact

**Seller:**
1. Lists car (web form, or later via agent)
2. Gets notified when someone's interested
3. Meets buyer, transaction happens offline

## Day-One Scope

- Agent infrastructure + minimal UI
- Seeded with 20-50 real listings from network
- Website actively steers people toward using their AI

## Site Structure

| Route | Purpose |
|-------|---------|
| `/` | Landing — explains concept, featured listings, teaches "how to use via AI" |
| `/cars` | All listings — browsable by humans, structured for AI |
| `/cars/[id]` | Single listing — full details, JSON-LD, agent-readable |
| `/sell` | List your car — form + instructions for "list via your AI" |
| `/messages` | Inbox (requires auth) |
| `/llms.txt` | Agent instructions |

## Key Design Principle

The website isn't a fallback — it's a **signpost pointing to the real experience**.

Instead of: "Here's a search box, browse our listings"

It's: "Copy this into ChatGPT: *Find me a car under $20k on garage.co.nz*"

## Data Model (Simple)

```json
{
  "id": "abc123",
  "make": "Toyota",
  "model": "Corolla",
  "year": 2018,
  "kms": 85000,
  "price": 14500,
  "location": "Wellington",
  "description": "...",
  "photos": ["url1", "url2"],
  "sellerContact": { "email": "...", "phone": "..." },
  "createdAt": "2026-03-21T00:00:00Z"
}
```

## Tech Stack

- Astro (already set up)
- Data: Start with JSON file, move to Supabase/D1 later
- Deployed to garage.co.nz

## Next Steps

1. Replace the Pac-Man game with the marketplace landing page
2. Build the listing data structure and seed with test data
3. Create `/cars` and `/cars/[id]` pages with schema.org markup
4. Add `/llms.txt` with agent instructions
5. Build the "sell" form
6. Add messaging system

---

*Design validated through brainstorming session 2026-03-21*
