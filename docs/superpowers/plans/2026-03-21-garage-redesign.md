# Garage.co.nz Redesign - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform garage.co.nz so listings are front and center - homepage shows cars immediately, current landing becomes /about.

**Architecture:** Update Layout with new color scheme, create Header component with logo, swap homepage to show listings grid, move current landing content to /about.

**Tech Stack:** Astro SSR, CSS custom properties, SVG favicon

---

### Task 1: Update Layout with New Color Scheme

**Files:**
- Modify: `src/components/Layout.astro`

- [ ] **Step 1: Add CSS custom properties for new color scheme**

In Layout.astro, update the `<style>` block to add:
```css
:root {
  --color-primary: #0066ff;
  --color-primary-dark: #0052cc;
  --color-bg: #f8f9fa;
  --color-surface: #ffffff;
  --color-text: #1a1a1a;
  --color-text-muted: #666666;
  --color-border: #e0e0e0;
}

body {
  background: var(--color-bg);
  color: var(--color-text);
}
```

- [ ] **Step 2: Verify dev server shows updated styles**

Run: `npm run dev`
Check: Body background should be light gray (#f8f9fa)

- [ ] **Step 3: Commit**

```bash
git add src/components/Layout.astro
git commit -m "feat: add color scheme CSS variables"
```

---

### Task 2: Create Header Component with Logo

**Files:**
- Create: `src/components/Header.astro`
- Modify: `src/components/Layout.astro`

- [ ] **Step 1: Create Header component**

```astro
---
// Header.astro - Site header with garage door logo
---

<header class="site-header">
  <a href="/" class="logo">
    <div class="logo-icon">
      <div class="bar"></div>
      <div class="bar"></div>
      <div class="bar"></div>
    </div>
    <span class="logo-text">garage</span>
  </a>
  <nav class="nav">
    <a href="/sell">Sell</a>
    <a href="/about">About</a>
  </nav>
</header>

<style>
  .site-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
  }

  .logo-icon {
    width: 32px;
    height: 32px;
    background: var(--color-primary);
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
  }

  .logo-icon .bar {
    width: 20px;
    height: 4px;
    background: white;
    border-radius: 1px;
  }

  .logo-text {
    font-weight: 600;
    font-size: 1.25rem;
    color: var(--color-text);
  }

  .nav {
    display: flex;
    gap: 1.5rem;
  }

  .nav a {
    color: var(--color-text-muted);
    text-decoration: none;
    font-size: 0.95rem;
  }

  .nav a:hover {
    color: var(--color-primary);
  }
</style>
```

- [ ] **Step 2: Import Header into Layout**

In Layout.astro, add import and use:
```astro
---
import Header from './Header.astro';
---

<html>
  <body>
    <Header />
    <main>
      <slot />
    </main>
  </body>
</html>
```

- [ ] **Step 3: Verify header appears**

Run: `npm run dev`
Check: Blue garage door logo + "garage" text + Sell/About links

- [ ] **Step 4: Commit**

```bash
git add src/components/Header.astro src/components/Layout.astro
git commit -m "feat: add Header component with garage door logo"
```

---

### Task 3: Create Favicon

**Files:**
- Create: `public/favicon.svg`

- [ ] **Step 1: Create SVG favicon**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#0066ff"/>
  <rect x="6" y="8" width="20" height="4" rx="1" fill="white"/>
  <rect x="6" y="14" width="20" height="4" rx="1" fill="white"/>
  <rect x="6" y="20" width="20" height="4" rx="1" fill="white"/>
</svg>
```

- [ ] **Step 2: Update Layout to use favicon**

In Layout.astro head:
```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
```

- [ ] **Step 3: Verify favicon shows in browser tab**

- [ ] **Step 4: Commit**

```bash
git add public/favicon.svg src/components/Layout.astro
git commit -m "feat: add garage door favicon"
```

---

### Task 4: Create About Page (Move Landing Content)

**Files:**
- Create: `src/pages/about.astro`
- Reference: `src/pages/index.astro` (current content)

- [ ] **Step 1: Create about.astro with current landing content**

Move the "What is garage.co.nz" and AI agent explanation content to /about. Adapt styling to new color scheme.

- [ ] **Step 2: Verify /about shows landing content**

Run: `npm run dev`
Navigate to: http://localhost:4500/about

- [ ] **Step 3: Commit**

```bash
git add src/pages/about.astro
git commit -m "feat: create about page with site info"
```

---

### Task 5: Transform Homepage to Listings Grid

**Files:**
- Modify: `src/pages/index.astro`
- Reference: `src/pages/cars/index.astro` (copy grid logic)

- [ ] **Step 1: Replace index.astro with listings grid**

Copy the listings grid logic from cars/index.astro:
- Import getAllListings from lib/listings
- Show car grid with ListingCard components
- Keep query param filtering for AI agents
- Add simple heading "Cars for sale" with count

- [ ] **Step 2: Update ListingCard links to use /cars/[id]**

Cards should still link to /cars/[id] for detail pages.

- [ ] **Step 3: Verify homepage shows car grid**

Run: `npm run dev`
Navigate to: http://localhost:4500/
Check: Should see car listings immediately

- [ ] **Step 4: Test filtering still works**

Navigate to: http://localhost:4500/?make=Toyota
Check: Should filter to Toyota cars only

- [ ] **Step 5: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat: homepage now shows car listings grid"
```

---

### Task 6: Update ListingCard Styling

**Files:**
- Modify: `src/components/ListingCard.astro`

- [ ] **Step 1: Update card styling for new color scheme**

Use CSS variables, ensure cards have:
- White background (var(--color-surface))
- Subtle border (var(--color-border))
- Price in primary color
- Clean, minimal look

- [ ] **Step 2: Verify cards look good on homepage**

- [ ] **Step 3: Commit**

```bash
git add src/components/ListingCard.astro
git commit -m "style: update ListingCard for new color scheme"
```

---

### Task 7: Clean Up /cars Route

**Files:**
- Modify or remove: `src/pages/cars/index.astro`

- [ ] **Step 1: Redirect /cars to /**

Either remove the file or add a redirect:
```astro
---
return Astro.redirect('/', 301);
---
```

- [ ] **Step 2: Verify /cars redirects to homepage**

- [ ] **Step 3: Commit**

```bash
git add src/pages/cars/index.astro
git commit -m "refactor: redirect /cars to homepage"
```

---

### Task 8: Update llms.txt

**Files:**
- Modify: `public/llms.txt`

- [ ] **Step 1: Update navigation instructions**

Change references from /cars to / for browsing.

- [ ] **Step 2: Commit**

```bash
git add public/llms.txt
git commit -m "docs: update llms.txt for new URL structure"
```

---

### Task 9: Deploy and Verify

- [ ] **Step 1: Build**

```bash
npm run build
```

- [ ] **Step 2: Deploy to Cloudflare**

```bash
npx wrangler pages deploy dist --project-name garage
```

- [ ] **Step 3: Verify live site**

Check: https://garage.co.nz shows car listings immediately with new design
