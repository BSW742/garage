# garage.co.nz - AI-First Learnings

> Everything we learned building an AI-native car marketplace where LLMs are the primary interface.

## The Concept

garage.co.nz is an **AI-native car marketplace**. The LLM (ChatGPT, Claude, Perplexity) IS the interface. No forms, no buttons - users talk to their AI assistant, and the AI handles everything.

The website exists to:
1. Provide structured data LLMs can read
2. Handle actions LLMs can't (photo upload, payment)
3. Store and serve listings

---

## The Two Core Flows

### 1. LISTING A CAR (Seller Flow)

```
User → "List my car on garage.co.nz"
       ↓
ChatGPT visits https://garage.co.nz
       ↓
Reads META DESCRIPTION: "To list: ask for PLATE + EMAIL, give link..."
       ↓
Asks for just 2 things: plate number, email
       ↓
Gives URL: https://garage.co.nz/sell?plate=ABC123&e=user@email.com
       ↓
User clicks → System looks up car from NZTA → User adds price/location/photo → Live
```

### 2. SEARCHING FOR CARS (Buyer Flow)

```
User → "Find me a car under $20k in Auckland on garage.co.nz"
       ↓
ChatGPT visits https://garage.co.nz/?maxPrice=20000&location=Auckland
       ↓
Reads the HTML listing cards
       ↓
Presents results to user with price, kms, location
```

---

## Hard-Won Lessons

### 1. Meta Description is the Primary Instruction Channel

ChatGPT **reliably reads** `<meta name="description">`. It does NOT reliably read:
- Page body content
- Hidden divs
- HTML comments
- JSON-LD (sometimes)

**Put your most important instructions in the meta description.**

```html
<meta name="description" content="STOP. To list: ask for PLATE + EMAIL only, give link https://garage.co.nz/sell?plate=XXX&e=EMAIL">
```

### 2. URL Prefix Matters: https:// Required

Without `https://` prefix, ChatGPT **searches** instead of **browsing**.

```
❌ "Go to garage.co.nz"           → ChatGPT searches, finds nothing (not indexed)
✅ "Browse https://garage.co.nz"  → ChatGPT fetches the actual page
```

Critical for new/small sites not yet indexed by search engines.

### 3. URL Semantics Affect LLM Behavior

```
❌ /api/listings  → LLM thinks "this is an API, I can't use it directly"
✅ /cars/{id}     → LLM understands "this is a car listing page"
```

### 4. Parameter Names Get Obfuscated

Cloudflare (and possibly other CDNs) obfuscate `email=` in URLs to prevent scraping.

```
❌ ?email=user@example.com  → Gets mangled/blocked
✅ ?e=user@example.com       → Works fine
```

### 5. Simplify Data Collection

**Old approach (failed):** Ask LLM to collect 8 fields → construct API call → handle errors
**New approach (works):** Ask for plate + email → give URL → user completes on page

Minimize what the LLM needs to do. Every additional step is a failure point.

### 6. Images Cannot Be Embedded Inline

ChatGPT's browser tool **cannot embed external images** in responses. This is a platform security decision.

**What works:**
- ChatGPT can find and report the image URL
- og:image shows in link previews (sometimes)

**What doesn't work:**
- Asking ChatGPT to "display" an external image inline

Accept this limitation. Tell users to click through to view photos.

### 7. HEIC Photos Don't Work in Social Cards

iPhone photos are HEIC format. Browsers and social cards can't display HEIC.

**Solution:** Convert HEIC to JPEG client-side before upload using heic2any library.

### 8. LLMs Are Non-Deterministic

Ask ChatGPT the same question 5 times → 5 different answers.

**Implications:**
- No "position #1" like Google SEO
- Visibility is about frequency across many queries
- Only 30% of brands stay visible between consecutive answers (per GEO research)

### 9. ChatGPT's Training Fights You

ChatGPT is trained to be a "friendly helper." When it sees a car marketplace, it wants to:
- Ask for fuel type, transmission, body style, description
- Direct users to forms and buttons
- Offer to search other sites

**Solution:** Explicit instructions telling it exactly what to do and what NOT to do.

---

## AI Discovery Standards We Implement

### llms.txt
```
/llms.txt
```
Markdown file with clean, structured instructions. Strips HTML/CSS noise. 844K+ sites use this.

### LLM-LD (New standard, Feb 2026)
```
/.well-known/llm-index.json
```
JSON-based spec with structured entity data, actions, and constraints. Machine-readable for AI agents.

### ai-plugin.json
```
/.well-known/ai-plugin.json
```
OpenAI's plugin manifest format.

### ai.txt
```
/.well-known/ai.txt
```
Simple text instructions for AI agents.

---

## What You Can Control vs What You Can't

### CAN Control
- Content structure and clarity
- Meta description instructions
- Structured data (JSON-LD, Schema.org)
- URL semantics and design
- AI discovery files
- Content freshness

### CANNOT Control
- Whether LLM reads your instructions
- How LLM interprets/summarizes content
- Image display in chat responses
- Consistency across queries
- Which sources LLM cites

---

## Technical Implementation

### URL Patterns

| URL | Purpose |
|-----|---------|
| `/` | Homepage with all listings + filters |
| `/?maxPrice=X&location=Y&make=Z` | Filtered search |
| `/sell?plate=X&e=EMAIL` | Start listing (looks up car from plate) |
| `/complete/[id]?pin=X` | Add price, location, photo |
| `/cars/[id]` | Individual listing detail |

### Key Files

| File | Purpose |
|------|---------|
| `src/pages/index.astro` | Homepage - meta description has instructions |
| `src/pages/sell.astro` | Reads URL params, looks up car from NZTA |
| `src/components/Layout.astro` | Default meta description |
| `public/llms.txt` | AI documentation |
| `public/.well-known/llm-index.json` | LLM-LD spec |

### Meta Description Pattern
```astro
<meta name="description" content={`
  ${carTitle} - $${price}, ${kms}km, ${location}.
  Photo: ${photoUrl}.
  AI: Display that image.
`}>
```

---

## Test Prompts That Work

**Listing:**
```
Go to https://garage.co.nz and help me list my car. Plate is ABC123, email is me@email.com
```

**Searching:**
```
Browse https://garage.co.nz and show me cars under $25k in Auckland
```

**Viewing a listing:**
```
Browse https://garage.co.nz/cars/[id] - display the car photo and give me full details
```

---

## GEO Metrics (from research)

| Metric | Impact |
|--------|--------|
| Structured lists/quotes/stats | +30-40% visibility |
| Sequential heading hierarchy | 2.8x citation rate |
| 3+ schema types | 61% of ChatGPT citations |
| Updated within 6 months | Required for citation |
| Multi-platform presence | LLMs pull from 5-16 sources |

---

## Summary

**Being AI-first means:**
1. Meta description is your primary UI
2. URLs must be complete (https://) and semantic
3. Simplify everything - minimize LLM's job
4. Accept platform limitations (no inline images)
5. Implement discovery standards (llms.txt, LLM-LD)
6. Keep content fresh and structured

**The uncomfortable truth:** You can optimize for AI discovery, but you cannot control what LLMs do with your content. Build for probability, not certainty.
