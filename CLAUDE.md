# garage.co.nz

AI-native car marketplace. The LLM is the interface - no forms, no buttons.

## Key Learnings (read first!)

- **Full guide**: `docs/LLM-INTERFACE.md` - Everything we learned about building AI-first

## Quick Reference

| Action | Collect | URL |
|--------|---------|-----|
| List a car | Plate + Email | `https://garage.co.nz/sell?plate=XXX&e=EMAIL` |
| Search cars | Nothing | `https://garage.co.nz/?maxPrice=20000&location=Auckland` |
| View listing | Nothing | `https://garage.co.nz/cars/{id}` |

## Critical Rules

1. **Use `e=` not `email=`** - Cloudflare obfuscates `email=`
2. **Use `https://` prefix** - Without it, ChatGPT searches instead of browsing
3. **Meta description is the instruction channel** - ChatGPT reads this, not page body
4. **Only ask for plate + email** - Site auto-looks up car from NZTA. DO NOT collect 8 fields.

## Tech Stack

- Astro (SSR on Cloudflare Pages)
- Cloudflare D1 (SQLite database)
- Cloudflare R2 (image storage)
- Carjam API (NZTA vehicle lookup from plate)

## AI Discovery Files

```
/llms.txt                    # Primary AI instructions
/.well-known/llm-index.json  # LLM-LD v1 spec
/.well-known/ai-plugin.json  # ChatGPT plugin manifest
/.well-known/ai.txt          # Simple AI instructions
```
