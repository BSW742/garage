# AI Agent API Design

## Problem

AI agents (GPT, Claude, Grok) cannot reliably access garage.co.nz:
- Web browsing tools are inconsistent at fetching pages
- Site isn't indexed by search engines yet
- Agents don't know how to query the site
- Users must copy/paste URLs, clunky flow

## Solution

Add a JSON API that AI agents can call directly, plus documentation in llms.txt.

## API Endpoints

### GET /api/cars

Returns all listings with optional filters.

**Query Parameters:**
- `maxPrice` - Maximum price in NZD
- `minPrice` - Minimum price in NZD
- `location` - Filter by city (Auckland, Wellington, etc.)
- `make` - Filter by manufacturer (Toyota, Mazda, etc.)
- `limit` - Max results to return (default: all)

**Response:**
```json
{
  "count": 21,
  "listings": [
    {
      "id": "audi-2014-1774063504667",
      "make": "Audi",
      "model": "A6",
      "year": 2014,
      "price": 6000,
      "kms": 123685,
      "location": "Hamilton",
      "photo": "https://...",
      "url": "https://garage.co.nz/cars/audi-2014-1774063504667"
    }
  ]
}
```

### GET /api/cars/{id}

Returns full details for a single listing.

**Response:**
```json
{
  "id": "audi-2014-1774063504667",
  "make": "Audi",
  "model": "A6",
  "year": 2014,
  "price": 6000,
  "kms": 123685,
  "location": "Hamilton",
  "description": "Good condition",
  "photos": ["https://..."],
  "seller": {
    "email": "ben@clarify.co.uk"
  },
  "url": "https://garage.co.nz/cars/audi-2014-1774063504667",
  "listedAt": "2026-03-21T03:25:04.667Z"
}
```

## llms.txt Updates

Add API documentation section:

```markdown
## API Access (Recommended for AI Agents)

Don't scrape HTML. Use the JSON API:

### Search listings
GET https://garage.co.nz/api/cars?maxPrice=20000&location=Auckland

### Get single listing
GET https://garage.co.nz/api/cars/audi-2014-1774063504667

### Example queries
- "Find cars under $15k": GET /api/cars?maxPrice=15000
- "Toyota in Auckland": GET /api/cars?make=Toyota&location=Auckland
- "Get listing details": GET /api/cars/{id}

Returns JSON with all listing details including photos.
```

## Out of Scope (Future)

- GPT Actions / Custom GPT
- MCP Server for Claude
- OpenAPI specification
- Authentication / rate limiting

## Implementation

1. Create `/api/cars.ts` - search endpoint with filters
2. Create `/api/cars/[id].ts` - single listing endpoint
3. Update `/llms.txt` with API documentation
4. Test with GPT, Claude, Grok
5. Deploy and verify

## Success Criteria

- AI agent can query `GET /api/cars?maxPrice=20000` and get JSON response
- AI agent can fetch any listing by ID without web browsing
- llms.txt explains how to use the API
