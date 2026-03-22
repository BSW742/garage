# garage.co.nz - LLM-as-Interface: Full Learnings

## The Concept

garage.co.nz is an **AI-native car marketplace**. The LLM (ChatGPT, Claude) IS the interface. No forms, no buttons - users talk to their AI assistant, and the AI handles everything.

---

## Two Core Flows

### 1. LISTING A CAR (Seller Flow)

**How it works:**
```
User → "List my car on garage.co.nz"
       ↓
ChatGPT visits garage.co.nz
       ↓
Reads META DESCRIPTION: "To list: garage.co.nz/sell?make=X&model=X..."
       ↓
Collects 8 fields from user: make, model, year, kms, price, location, email, pin
       ↓
Builds URL: garage.co.nz/sell?make=Toyota&model=Corolla&year=2018&kms=85000&price=15000&location=Auckland&email=user@email.com&pin=1234
       ↓
User clicks URL → /sell page auto-submits to API → listing created → upload link shown
```

**Key discovery:** ChatGPT **cannot POST to APIs**. Solution: URL-based submission. ChatGPT builds a URL with query params, user clicks it, page handles the rest.

**What ChatGPT reads:** The meta description. Not the page body. Not HTML comments. The `<meta name="description">` tag.

---

### 2. SEARCHING FOR CARS (Buyer Flow)

**How it works:**
```
User → "Find me a car under $20k in Auckland on garage.co.nz"
       ↓
ChatGPT visits garage.co.nz
       ↓
Reads META DESCRIPTION: "To search: browse garage.co.nz/browse?maxPrice=20000&location=Auckland"
       ↓
ChatGPT visits /browse?maxPrice=20000&location=Auckland
       ↓
Reads the HTML listing cards (year, make, model, price, kms, location)
       ↓
Presents results to user
```

**Key discovery:** URL semantics matter.
- `/api/cars` → ChatGPT thinks "API endpoint, I can't call this"
- `/browse` → ChatGPT thinks "browseable page, I can read this"

The word "browse" in the URL primes ChatGPT to actually fetch and read the page.

---

## What We Learned About ChatGPT

### ChatGPT has two modes:

| Mode | Trigger | Behavior |
|------|---------|----------|
| **Search** | No URL or ambiguous prompt | Searches Bing, finds docs/snippets, doesn't fetch live pages |
| **Browse** | Explicit URL with `https://` | Actually fetches and reads the page content |

### What ChatGPT reads (in order of reliability):

1. **Meta description** - Most reliable. ChatGPT almost always reads this.
2. **Page title** - Sometimes reads.
3. **Page body** - Only reads if it actually browses (not searches).
4. **llms.txt** - May find via search, but not guaranteed.

### ChatGPT's "helpful" training fights you:

ChatGPT is trained to be a "friendly helper." When it sees a car marketplace, it wants to:
- Ask for fuel type, transmission, body style, description
- Direct users to forms and buttons
- Offer to search other sites

**Solution:** Explicit instructions in meta description telling it exactly what to do and what NOT to do.

---

## The Technical Implementation

### Files that matter:

| File | Purpose |
|------|---------|
| `src/pages/index.astro` | Homepage - shows listings, meta description has instructions |
| `src/pages/browse.astro` | Search results page - ChatGPT reads this for searching |
| `src/pages/sell.astro` | Auto-submit page - reads URL params, POSTs to API |
| `src/components/Layout.astro` | Contains default meta description |
| `public/llms.txt` | AI documentation (backup, not primary) |

### URL patterns:

| URL | Purpose |
|-----|---------|
| `/` | Homepage with all listings |
| `/browse?maxPrice=X&location=Y&make=Z` | Filtered search results |
| `/sell?make=X&model=X&year=X&kms=X&price=X&location=X&email=X&pin=X` | Auto-creates listing |
| `/cars/[id]` | Individual listing detail |
| `/api/cars` | JSON API (ChatGPT can't use this) |

---

## What Changes When Google Indexes

**Current state:** Google has not indexed garage.co.nz yet (submitted to Search Console, waiting 24-48 hours).

### Before Google indexes:

- User MUST include `https://garage.co.nz` in prompt
- This forces ChatGPT to **browse** (fetch the actual page)
- If user just says "garage.co.nz", ChatGPT might **search** and find nothing

### After Google indexes:

- User can say "find cars on garage.co.nz" without full URL
- ChatGPT searches → finds garage.co.nz in results → visits it
- Meta description appears in search results → ChatGPT reads it
- **More natural prompts will work**

### What won't change:

- ChatGPT still can't call APIs
- ChatGPT still needs `/browse` URL semantics to read listings
- Meta description is still the primary instruction delivery method

---

## Summary: The Two Tricks

### Trick 1: Meta description is your instruction channel
```html
<meta name="description" content="To search: browse garage.co.nz/browse?maxPrice=X. To list: garage.co.nz/sell?make=X&model=X...">
```

### Trick 2: URL semantics prime ChatGPT's behavior
- `/browse` = "I can read this page"
- `/api/` = "I can't use this"
- `/sell?params` = "User clicks this link"

---

## Test Prompts That Work

**Listing:**
```
Go to https://garage.co.nz and help me list my 2018 Honda Civic with 75000km for $18000 in Wellington. Email: me@email.com, PIN: 5678
```

**Searching:**
```
Show me cars under $25k in Auckland on garage.co.nz
```

**After Google indexes:**
```
Find me a reliable car under $20k on garage.co.nz
```
