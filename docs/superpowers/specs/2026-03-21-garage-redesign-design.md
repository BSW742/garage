# Garage.co.nz Redesign - Design Spec

## Goal

Transform garage.co.nz from a "scared" landing-page-first site into a confident marketplace where listings are front and center. The homepage IS the browse experience.

## Design Decisions

### Color Scheme: Clean/Modern
- Primary: `#0066ff` (trustworthy blue)
- Secondary: `#0052cc` (darker blue for hover states)
- Background: `#f8f9fa` (light gray)
- Surface: `#ffffff` (white cards)
- Text: `#1a1a1a` (near-black)
- Text muted: `#666666`
- Border: `#e0e0e0`

### Logo: Garage Door Icon
- Square icon with three horizontal white bars on blue background
- Represents a garage roller door
- Works as favicon, mobile icon, and header logo
- Paired with "garage" wordmark in header

### Homepage Layout: Minimal
- Compact header: logo + wordmark on left, "Sell" and "About" links on right
- No hero section, no tagline, no marketing fluff
- Immediately shows car listings grid (3 columns on desktop)
- Current landing page content moves to /about

## Information Architecture

```
/                   → Car listings grid (was /cars)
/cars/[id]          → Individual car detail page (unchanged)
/sell               → Sell your car form (unchanged)
/about              → Site info, how it works (was /)
/llms.txt           → AI agent instructions (unchanged)
```

## Header Component

```
┌─────────────────────────────────────────────────────────────┐
│ [≡] garage                                      Sell  About │
└─────────────────────────────────────────────────────────────┘
```

- Logo icon: 32x32px blue square with white horizontal bars
- Wordmark: "garage" in semi-bold, dark text
- Nav links: simple text links, no buttons
- Sticky header on scroll (optional enhancement)

## Homepage (Listings Grid)

- Page title: "Cars for Sale in New Zealand | garage.co.nz"
- Optional subtitle showing count: "20 cars for sale"
- 3-column grid on desktop, 2 on tablet, 1 on mobile
- Each card shows: image placeholder, price (bold), year/make/model
- Cards link to detail page
- Filtering via query params (existing functionality preserved)

## About Page

Content from current landing page:
- What is garage.co.nz
- How AI agents work with the site
- Links to browse cars and sell

## Visual Style

- Border radius: 8px for cards, 4px for buttons
- Shadows: subtle (0 1px 3px rgba(0,0,0,0.1))
- Font: system font stack
- Spacing: 1rem grid gaps, comfortable padding

## Files to Change

1. `src/components/Layout.astro` - Add new color scheme CSS variables, update header
2. `src/components/Header.astro` - NEW: Extract header as reusable component with logo
3. `src/pages/index.astro` - Replace with listings grid (copy from /cars)
4. `src/pages/about.astro` - NEW: Move current landing content here
5. `src/pages/cars/index.astro` - Can be removed or redirect to /
6. `public/favicon.svg` - NEW: Garage door icon as favicon
