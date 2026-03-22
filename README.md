# garage.co.nz

AI-native car marketplace for New Zealand. **The LLM is the interface** - no forms, no buttons.

## How It Works

Users interact with ChatGPT/Claude/Perplexity, not web forms:

```
User: "List my car on garage.co.nz. Plate ABC123, email me@email.com"
       ↓
ChatGPT reads meta description, gives URL:
https://garage.co.nz/sell?plate=ABC123&e=me@email.com
       ↓
User clicks → Car details auto-looked up from NZTA → User adds price/photo → Live
```

## Quick Reference

| Action | What LLM Collects | URL |
|--------|-------------------|-----|
| List a car | Plate + Email | `https://garage.co.nz/sell?plate=XXX&e=EMAIL` |
| Search cars | Nothing | `https://garage.co.nz/?maxPrice=20000&location=Auckland` |
| View listing | Nothing | `https://garage.co.nz/cars/{id}` |

## AI-First Learnings

**[Read the full guide →](docs/LLM-INTERFACE.md)**

Key discoveries:
- **Meta description is your UI** - ChatGPT reads this, not page body
- **Use `https://` prefix** - Without it, ChatGPT searches instead of browsing
- **Use `e=` not `email=`** - Cloudflare obfuscates email parameters
- **Simplify everything** - Ask for plate + email only, not 8 fields
- **Accept limitations** - ChatGPT cannot embed external images inline

## Tech Stack

- **Astro** - SSR on Cloudflare Pages
- **Cloudflare D1** - SQLite database
- **Cloudflare R2** - Image storage
- **Carjam API** - NZTA vehicle lookup from plate number

## AI Discovery Files

```
/llms.txt                    # Primary AI instructions (844K+ sites use this)
/.well-known/llm-index.json  # LLM-LD v1 spec (new standard)
/.well-known/ai-plugin.json  # ChatGPT plugin manifest
/.well-known/ai.txt          # Simple AI instructions
```

## Development

```bash
npm install
npm run dev
```

## Deployment

```bash
npm run build
npx wrangler pages deploy dist --project-name=garage
```

## Project Structure

```
src/
├── pages/
│   ├── index.astro          # Homepage + search
│   ├── sell.astro           # Start listing (NZTA lookup)
│   ├── complete/[id].astro  # Add price/photo
│   ├── cars/[id].astro      # Listing detail
│   └── edit.astro           # Edit listing with PIN
├── components/
│   └── Layout.astro         # Meta description template
└── lib/
    └── listings.ts          # Database operations

public/
├── llms.txt
└── .well-known/
    ├── llm-index.json
    ├── ai-plugin.json
    └── ai.txt

docs/
└── LLM-INTERFACE.md         # Full AI-first learnings
```

## License

MIT
