# Product Hunt Launch - garage.co.nz

## Tagline (60 chars max)
**"The car marketplace AI agents can actually use"**

Alternative:
- "Find cars in NZ by just asking your AI"
- "Used cars for sale, with a JSON API for AI"

## Description (260 chars)
garage.co.nz is a New Zealand car marketplace built for the AI era. No scraping needed—AI agents can query our JSON API directly. Ask ChatGPT "find me a cheap car in Wellington" and get real results, not hallucinations.

## Longer Description
Most websites are hostile to AI. Logins, JavaScript rendering, anti-bot measures—they make it nearly impossible for AI agents to help you with real-world tasks.

garage.co.nz is different. We built a car marketplace that AI agents can actually use:

**For AI Agents:**
- Clean JSON API at `/api/cars` with filters (price, location, make)
- Full documentation at `/llms.txt`
- OpenAPI spec at `/openapi.json`
- Schema.org structured data on every listing
- robots.txt welcomes all AI crawlers

**For Humans:**
- Simple, clean interface—no account required
- List your car in 60 seconds with CarJam plate lookup
- Auto-fetched photos from Wikipedia/Google Images
- Direct seller contact (email/phone)

**How it works with AI:**
1. Ask any AI: "Find me a Toyota under $15k in Auckland on garage.co.nz"
2. AI calls our API: `GET /api/cars?make=Toyota&maxPrice=15000&location=Auckland`
3. You get real listings with real prices and real seller contact info

This is what "AI-native" actually means—not just AI-generated content, but infrastructure AI can reliably use.

## Topics/Categories
- Cars
- Marketplace
- Artificial Intelligence
- API
- New Zealand

## First Comment (Maker)
Hey Product Hunt! I'm Ben, and I built garage.co.nz because I was frustrated that AI assistants couldn't help me with real-world tasks like finding a car.

The problem isn't AI capability—it's that most websites are built to block automated access. So I built one that welcomes it.

Key features:
- JSON API for AI agents (no auth, no rate limits)
- OpenAPI spec so tools can auto-discover the API
- llms.txt explaining how to use the site
- CarJam integration for NZ plate lookup
- Auto image fetching

Currently focused on NZ (that's where I am), but the approach could work anywhere.

Would love your feedback—especially from anyone building AI tools that need to interact with the real world!

## Social Proof / Traction
- Working with ChatGPT, Claude, and Grok
- Live listings from real sellers
- No authentication required for API access

## Launch Checklist
- [ ] Create Product Hunt account
- [ ] Upload logo (use /favicon.svg)
- [ ] Upload gallery images (homepage, API response, listing page)
- [ ] Schedule launch for 12:01 AM PT Tuesday-Thursday
- [ ] Prepare tweet thread for launch day
- [ ] Post in relevant communities (HN, Reddit r/newzealand, r/artificial)

## URLs to Include
- Website: https://garage.co.nz
- API Docs: https://garage.co.nz/llms.txt
- OpenAPI: https://garage.co.nz/openapi.json
