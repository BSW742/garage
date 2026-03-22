# garage.co.nz

AI-native car marketplace. The LLM is the interface - no forms, no buttons.

## Key Documentation

- **LLM Interface Guide**: `docs/LLM-INTERFACE.md` - How ChatGPT/Claude interact with this site (listing cars, searching cars, what works, what doesn't)

## Quick Reference

**Listing flow**: User talks to ChatGPT → collects 8 fields → builds `/sell?make=X&model=X&year=X&kms=X&price=X&location=X&email=X&pin=X` URL → user clicks → listing created

**Search flow**: ChatGPT visits `/browse?maxPrice=X&location=Y` → reads HTML listings → presents to user

**Key insight**: ChatGPT reads the meta description, not page body. URL semantics matter (`/browse` works, `/api` doesn't).

## Tech Stack

- Astro (SSR on Cloudflare Pages)
- Cloudflare D1 (SQLite database)
- Cloudflare R2 (image storage)
