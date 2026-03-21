# LLM-as-Interface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable users to list cars entirely through LLM conversation, with a magic link for photo upload.

**Architecture:** LLM collects details conversationally, calls POST /api/listings to create stub with upload code, user uploads photo via /u/{code}, listing goes live. PIN enables future edits.

**Tech Stack:** Astro, Cloudflare D1 (SQLite), Cloudflare R2, TypeScript

---

## File Structure

| File | Responsibility |
|------|----------------|
| `src/lib/listings.ts` | Add upload_code, pin, photo_uploaded to Listing interface and DB functions |
| `src/pages/api/listings.ts` | Modify to accept pin, generate uploadCode, create stub, add rate limiting |
| `src/pages/api/listings/[id].ts` | Modify to require PIN auth for PATCH/DELETE |
| `src/pages/api/listings/status/[uploadCode].ts` | New: Check if photo uploaded |
| `src/pages/api/upload/[uploadCode].ts` | New: Receive photo, attach to listing |
| `src/pages/api/listings/by-pin.ts` | New: Lookup listing by PIN+email |
| `src/pages/u/[code].astro` | New: Bare minimum upload page |
| `src/pages/edit.astro` | New: PIN-based edit page |
| `public/llms.txt` | Update with listing creation workflow |
| `src/pages/index.astro` | Add AI hint comment |

---

### Task 1: Database Schema - Add New Columns

**Files:**
- Modify: `src/lib/listings.ts`

This task updates the Listing interface and database functions to support the new fields.

- [ ] **Step 1: Update Listing interface**

In `src/lib/listings.ts`, add to the Listing interface:

```typescript
interface Listing {
  // ... existing fields ...
  uploadCode?: string;
  pin?: string;  // stored hashed
  photoUploaded: boolean;
}
```

- [ ] **Step 2: Update DBRow interface**

Add the corresponding DB columns (snake_case):

```typescript
interface DBRow {
  // ... existing fields ...
  upload_code: string | null;
  pin: string | null;
  photo_uploaded: number;  // SQLite uses 0/1 for boolean
}
```

- [ ] **Step 3: Update rowToListing function**

Map the new fields:

```typescript
function rowToListing(row: DBRow): Listing {
  return {
    // ... existing mappings ...
    uploadCode: row.upload_code || undefined,
    pin: row.pin || undefined,
    photoUploaded: row.photo_uploaded === 1,
  };
}
```

- [ ] **Step 4: Update addListing function**

Modify to accept and store new fields:

```typescript
export async function addListing(db: D1Database, listing: Partial<Listing>): Promise<{ id: string; uploadCode: string }> {
  const id = `${listing.make?.toLowerCase()}-${listing.year}-${Date.now()}`;
  const uploadCode = generateUploadCode();  // 4 alphanumeric chars
  const hashedPin = listing.pin ? await hashPin(listing.pin) : null;

  await db.prepare(`
    INSERT INTO listings (id, make, model, year, kms, price, location, description, photos, seller_email, seller_phone, created_at, source, source_url, upload_code, pin, photo_uploaded)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    listing.make,
    listing.model,
    listing.year || new Date().getFullYear(),
    listing.kms || 0,
    listing.price || 0,
    listing.location || 'Auckland',
    listing.description || `${listing.year} ${listing.make} ${listing.model}`,
    JSON.stringify(listing.photos || []),
    listing.sellerContact?.email || '',
    listing.sellerContact?.phone || '',
    new Date().toISOString(),
    listing.source || 'garage',
    listing.sourceUrl || null,
    uploadCode,
    hashedPin,
    0  // photo_uploaded = false
  ).run();

  return { id, uploadCode };
}
```

- [ ] **Step 5: Add helper functions**

```typescript
function generateUploadCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'garage-salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPin(pin: string, hashedPin: string): Promise<boolean> {
  const hashed = await hashPin(pin);
  return hashed === hashedPin;
}

export async function getListingByUploadCode(db: D1Database, uploadCode: string): Promise<Listing | null> {
  const row = await db.prepare('SELECT * FROM listings WHERE upload_code = ?').bind(uploadCode).first<DBRow>();
  return row ? rowToListing(row) : null;
}

export async function markPhotoUploaded(db: D1Database, uploadCode: string, photoUrl: string): Promise<void> {
  await db.prepare(`
    UPDATE listings SET photos = ?, photo_uploaded = 1 WHERE upload_code = ?
  `).bind(JSON.stringify([photoUrl]), uploadCode).run();
}

export async function getListingsByPinAndEmail(db: D1Database, pin: string, email: string): Promise<Listing[]> {
  const rows = await db.prepare('SELECT * FROM listings WHERE seller_email = ?').bind(email).all<DBRow>();
  const listings: Listing[] = [];
  for (const row of rows.results || []) {
    const listing = rowToListing(row);
    if (listing.pin && await verifyPin(pin, listing.pin)) {
      listings.push(listing);
    }
  }
  return listings;
}
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/listings.ts
git commit -m "feat: add upload_code, pin, photo_uploaded to listings"
```

---

### Task 2: Run Database Migration

**Files:**
- None (uses wrangler CLI)

- [ ] **Step 1: Create migration SQL**

Run in terminal to add columns to production D1:

```bash
npx wrangler d1 execute garage-db --command "ALTER TABLE listings ADD COLUMN upload_code TEXT;"
npx wrangler d1 execute garage-db --command "ALTER TABLE listings ADD COLUMN pin TEXT;"
npx wrangler d1 execute garage-db --command "ALTER TABLE listings ADD COLUMN photo_uploaded INTEGER DEFAULT 0;"
npx wrangler d1 execute garage-db --command "CREATE INDEX idx_upload_code ON listings(upload_code);"
```

- [ ] **Step 2: Verify migration**

```bash
npx wrangler d1 execute garage-db --command "PRAGMA table_info(listings);"
```

Expected: Should show upload_code, pin, photo_uploaded columns.

---

### Task 3: Modify POST /api/listings

**Files:**
- Modify: `src/pages/api/listings.ts`

- [ ] **Step 1: Add rate limiting**

Add at top of file (after imports):

```typescript
// Rate limiting: simple in-memory store (resets on deploy)
const listingAttempts: Map<string, { count: number; resetAt: number }> = new Map();
```

- [ ] **Step 2: Update the POST handler to accept pin with rate limiting**

Find the existing POST handler and modify validation:

```typescript
export const POST: APIRoute = async ({ request, locals, clientAddress }) => {
  try {
    const { DB, IMAGES } = (locals as { runtime: Runtime }).runtime.env;

    // Rate limiting: 10 listings per hour per IP
    const ip = clientAddress || 'unknown';
    const now = Date.now();
    const attempt = listingAttempts.get(ip);

    if (attempt) {
      if (now < attempt.resetAt) {
        if (attempt.count >= 10) {
          return new Response(JSON.stringify({ error: 'Too many listings. Try again later.' }), {
            status: 429,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        attempt.count++;
      } else {
        listingAttempts.set(ip, { count: 1, resetAt: now + 3600000 });
      }
    } else {
      listingAttempts.set(ip, { count: 1, resetAt: now + 3600000 });
    }

    const data = await request.json();

    // Minimum required: make, model
    if (!data.make || !data.model) {
      return new Response(JSON.stringify({ error: 'Missing required fields: make, model' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // PIN required for new conversational listings (but not for trademe imports)
    const isTrademeImport = data.source === 'trademe';
    if (!isTrademeImport && data.pin !== undefined) {
      // Validate PIN is 4 numeric digits
      if (!/^\d{4}$/.test(data.pin)) {
        return new Response(JSON.stringify({ error: 'PIN must be exactly 4 digits' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Check PIN + email uniqueness (if pin provided)
    if (data.pin && data.sellerContact?.email) {
      const existing = await getListingsByPinAndEmail(DB, data.pin, data.sellerContact.email);
      if (existing.length > 0) {
        return new Response(JSON.stringify({
          error: 'You already have a listing with this PIN. Use garage.co.nz/edit to update it, or choose a different PIN.'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // ... rest of existing logic for defaults, source, auto-fetch ...
```

- [ ] **Step 3: Update response to include uploadCode**

Modify the success response:

```typescript
    const result = await addListing(DB, data);

    return new Response(JSON.stringify({
      success: true,
      listing: {
        id: result.id,
        url: `https://garage.co.nz/cars/${result.id}`,
        uploadCode: result.uploadCode,
        uploadUrl: `https://garage.co.nz/u/${result.uploadCode}`
      }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
```

- [ ] **Step 4: Add import for new functions**

At top of file:

```typescript
import { addListing, getListingsByPinAndEmail } from '../../lib/listings';
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/api/listings.ts
git commit -m "feat: accept PIN, return uploadCode, add rate limiting to POST /api/listings"
```

---

### Task 4: Modify PATCH/DELETE /api/listings/[id] for PIN Auth

**Files:**
- Modify: `src/pages/api/listings/[id].ts`

The existing endpoint needs PIN authentication for updates/deletes.

- [ ] **Step 1: Add PIN verification to PATCH**

Modify the existing PATCH handler to require PIN:

```typescript
import { verifyPin, getListingById } from '../../../lib/listings';

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const { DB, IMAGES } = (locals as { runtime: Runtime }).runtime.env;
  const { id } = params;

  if (!id) {
    return new Response(JSON.stringify({ error: 'Listing ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const data = await request.json();

  // Get current listing to verify PIN
  const listing = await getListingById(DB, id);
  if (!listing) {
    return new Response(JSON.stringify({ error: 'Listing not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Verify PIN if listing has one
  if (listing.pin) {
    if (!data.pin) {
      return new Response(JSON.stringify({ error: 'PIN required to edit this listing' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    const valid = await verifyPin(data.pin, listing.pin);
    if (!valid) {
      return new Response(JSON.stringify({ error: 'Invalid PIN' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // ... rest of existing PATCH logic for building update query ...
```

- [ ] **Step 2: Add PIN verification to DELETE**

Modify the existing DELETE handler similarly:

```typescript
export const DELETE: APIRoute = async ({ params, request, locals }) => {
  const { DB } = (locals as { runtime: Runtime }).runtime.env;
  const { id } = params;

  if (!id) {
    return new Response(JSON.stringify({ error: 'Listing ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Get current listing to verify PIN
  const listing = await getListingById(DB, id);
  if (!listing) {
    return new Response(JSON.stringify({ error: 'Listing not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Verify PIN if listing has one
  if (listing.pin) {
    const data = await request.json().catch(() => ({}));
    if (!data.pin) {
      return new Response(JSON.stringify({ error: 'PIN required to delete this listing' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    const valid = await verifyPin(data.pin, listing.pin);
    if (!valid) {
      return new Response(JSON.stringify({ error: 'Invalid PIN' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  await DB.prepare('DELETE FROM listings WHERE id = ?').bind(id).run();

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
```

- [ ] **Step 3: Add import**

```typescript
import { verifyPin, getListingById } from '../../../lib/listings';
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/api/listings/[id].ts
git commit -m "feat: require PIN auth for PATCH/DELETE listings"
```

---

### Task 5: Create GET /api/listings/status/[uploadCode]

**Files:**
- Create: `src/pages/api/listings/status/[uploadCode].ts`

- [ ] **Step 1: Create the directory**

```bash
mkdir -p src/pages/api/listings/status
```

- [ ] **Step 2: Create the endpoint**

```typescript
import type { APIRoute } from 'astro';
import { getListingByUploadCode } from '../../../../lib/listings';

interface Runtime {
  env: {
    DB: D1Database;
  };
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T>(): Promise<T | null>;
}

export const GET: APIRoute = async ({ params, locals }) => {
  const { DB } = (locals as { runtime: Runtime }).runtime.env;
  const { uploadCode } = params;

  if (!uploadCode) {
    return new Response(JSON.stringify({ error: 'Upload code required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const listing = await getListingByUploadCode(DB, uploadCode);

  if (!listing) {
    return new Response(JSON.stringify({ error: 'Upload code not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({
    id: listing.id,
    photoUploaded: listing.photoUploaded,
    url: listing.photoUploaded ? `https://garage.co.nz/cars/${listing.id}` : null
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
};
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/api/listings/status/
git commit -m "feat: add GET /api/listings/status/[uploadCode] endpoint"
```

---

### Task 6: Create POST /api/upload/[uploadCode]

**Files:**
- Create: `src/pages/api/upload/[uploadCode].ts`

- [ ] **Step 1: Create the directory**

```bash
mkdir -p src/pages/api/upload
```

- [ ] **Step 2: Create the endpoint**

```typescript
import type { APIRoute } from 'astro';
import { getListingByUploadCode, markPhotoUploaded } from '../../../lib/listings';

interface Runtime {
  env: {
    DB: D1Database;
    IMAGES: R2Bucket;
  };
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T>(): Promise<T | null>;
  run(): Promise<unknown>;
}

interface R2Bucket {
  put(key: string, value: ArrayBuffer, options?: { httpMetadata?: { contentType?: string } }): Promise<unknown>;
}

export const POST: APIRoute = async ({ params, request, locals }) => {
  const { DB, IMAGES } = (locals as { runtime: Runtime }).runtime.env;
  const { uploadCode } = params;

  if (!uploadCode) {
    return new Response(JSON.stringify({ error: 'Upload code required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Verify upload code exists
  const listing = await getListingByUploadCode(DB, uploadCode);
  if (!listing) {
    return new Response(JSON.stringify({ error: 'Invalid upload code' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Check if already uploaded
  if (listing.photoUploaded) {
    return new Response(JSON.stringify({ error: 'Photo already uploaded' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const data = await request.json();

  if (!data.image) {
    return new Response(JSON.stringify({ error: 'Missing image data' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Parse base64
  let base64Data = data.image;
  let contentType = 'image/jpeg';

  if (base64Data.startsWith('data:')) {
    const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
    if (matches) {
      contentType = matches[1];
      base64Data = matches[2];
    }
  }

  // Decode and upload to R2
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const ext = contentType.split('/')[1] || 'jpg';
  const filename = `${listing.id}-${Date.now()}.${ext}`;

  await IMAGES.put(filename, bytes.buffer, {
    httpMetadata: { contentType }
  });

  const photoUrl = `https://garage.co.nz/images/${filename}`;

  // Update listing
  await markPhotoUploaded(DB, uploadCode, photoUrl);

  return new Response(JSON.stringify({
    success: true,
    url: `https://garage.co.nz/cars/${listing.id}`,
    photoUrl
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/api/upload/
git commit -m "feat: add POST /api/upload/[uploadCode] endpoint"
```

---

### Task 7: Create Upload Page /u/[code]

**Files:**
- Create: `src/pages/u/[code].astro`

- [ ] **Step 1: Create the directory**

```bash
mkdir -p src/pages/u
```

- [ ] **Step 2: Create the page**

```astro
---
import Layout from '../../components/Layout.astro';
import { getListingByUploadCode } from '../../lib/listings';

const { DB } = Astro.locals.runtime.env;
const { code } = Astro.params;

const listing = code ? await getListingByUploadCode(DB, code) : null;

if (!listing) {
  return Astro.redirect('/sell?error=invalid-code');
}

if (listing.photoUploaded) {
  return Astro.redirect(`/cars/${listing.id}`);
}
---

<Layout title="Upload Photo" description="Upload photo for your listing">
  <section class="upload-page">
    <div class="upload-card">
      <h1>Upload photo for your</h1>
      <p class="car-name">{listing.year} {listing.make} {listing.model}</p>

      <div id="drop-zone" class="drop-zone">
        <input type="file" id="file-input" accept="image/*" />
        <p>Drop photo here<br/>or tap to select</p>
      </div>

      <div id="preview" class="preview" hidden>
        <img id="preview-img" alt="Preview" />
      </div>

      <button id="upload-btn" class="upload-btn" disabled>UPLOAD</button>

      <p id="status" class="status"></p>
    </div>

    <div id="success" class="success-card" hidden>
      <h1>Listed!</h1>
      <p class="car-name">{listing.year} {listing.make} {listing.model}</p>
      <p class="price">${listing.price?.toLocaleString() || 'Contact for price'}</p>
      <a id="listing-url" href={`/cars/${listing.id}`} class="view-link">View your listing →</a>
      <p class="edit-hint">Edit anytime at <a href="/edit">garage.co.nz/edit</a> using your PIN</p>
    </div>
  </section>
</Layout>

<script define:vars={{ code }}>
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const preview = document.getElementById('preview');
  const previewImg = document.getElementById('preview-img');
  const uploadBtn = document.getElementById('upload-btn');
  const status = document.getElementById('status');
  const successCard = document.getElementById('success');
  const uploadCard = document.querySelector('.upload-card');

  let selectedFile = null;

  dropZone.addEventListener('click', () => fileInput.click());

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFile(file);
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) {
      handleFile(fileInput.files[0]);
    }
  });

  function handleFile(file) {
    selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      preview.hidden = false;
      dropZone.hidden = true;
      uploadBtn.disabled = false;
    };
    reader.readAsDataURL(file);
  }

  uploadBtn.addEventListener('click', async () => {
    if (!selectedFile) return;

    uploadBtn.disabled = true;
    uploadBtn.textContent = 'UPLOADING...';
    status.textContent = '';

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const res = await fetch(`/api/upload/${code}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: e.target.result })
        });

        const data = await res.json();

        if (res.ok) {
          uploadCard.hidden = true;
          successCard.hidden = false;
        } else {
          status.textContent = data.error || 'Upload failed';
          uploadBtn.disabled = false;
          uploadBtn.textContent = 'UPLOAD';
        }
      } catch (err) {
        status.textContent = 'Upload failed. Please try again.';
        uploadBtn.disabled = false;
        uploadBtn.textContent = 'UPLOAD';
      }
    };
    reader.readAsDataURL(selectedFile);
  });
</script>

<style>
  .upload-page {
    max-width: 400px;
    margin: 2rem auto;
    padding: 0 1rem;
  }

  .upload-card, .success-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    padding: 2rem;
    text-align: center;
  }

  h1 {
    font-size: 1rem;
    color: var(--color-text-muted);
    margin: 0 0 0.5rem 0;
    font-weight: normal;
  }

  .car-name {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0 0 2rem 0;
  }

  .drop-zone {
    border: 2px dashed var(--color-border);
    padding: 3rem 1rem;
    cursor: pointer;
    transition: border-color 0.2s;
  }

  .drop-zone:hover, .drop-zone.dragover {
    border-color: var(--color-primary);
  }

  .drop-zone input {
    display: none;
  }

  .drop-zone p {
    margin: 0;
    color: var(--color-text-muted);
  }

  .preview {
    margin: 1rem 0;
  }

  .preview img {
    max-width: 100%;
    max-height: 300px;
    object-fit: contain;
  }

  .upload-btn {
    width: 100%;
    padding: 1rem;
    background: var(--color-primary);
    color: white;
    border: none;
    font-family: inherit;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    margin-top: 1rem;
  }

  .upload-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .status {
    color: #e53935;
    margin-top: 1rem;
    font-size: 0.875rem;
  }

  .success-card {
    border-color: var(--color-primary);
  }

  .success-card h1 {
    color: var(--color-primary);
    font-size: 1.5rem;
    font-weight: 600;
  }

  .price {
    font-size: 1.25rem;
    color: var(--color-primary);
    margin: 0 0 1.5rem 0;
  }

  .view-link {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    background: var(--color-primary);
    color: white;
    text-decoration: none;
    font-weight: 600;
  }

  .edit-hint {
    margin-top: 1.5rem;
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }

  .edit-hint a {
    color: var(--color-primary);
  }
</style>
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/u/
git commit -m "feat: add upload page /u/[code]"
```

---

### Task 8: Create POST /api/listings/by-pin

**Files:**
- Create: `src/pages/api/listings/by-pin.ts`

- [ ] **Step 1: Create the endpoint**

```typescript
import type { APIRoute } from 'astro';
import { getListingsByPinAndEmail } from '../../../lib/listings';

interface Runtime {
  env: {
    DB: D1Database;
  };
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T>(): Promise<{ results: T[] }>;
}

// Rate limiting: simple in-memory store (resets on deploy)
const attempts: Map<string, { count: number; resetAt: number }> = new Map();

export const POST: APIRoute = async ({ request, locals, clientAddress }) => {
  const { DB } = (locals as { runtime: Runtime }).runtime.env;

  // Rate limiting: 5 attempts per hour per IP
  const ip = clientAddress || 'unknown';
  const now = Date.now();
  const attempt = attempts.get(ip);

  if (attempt) {
    if (now < attempt.resetAt) {
      if (attempt.count >= 5) {
        return new Response(JSON.stringify({ error: 'Too many attempts. Try again later.' }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      attempt.count++;
    } else {
      attempts.set(ip, { count: 1, resetAt: now + 3600000 });
    }
  } else {
    attempts.set(ip, { count: 1, resetAt: now + 3600000 });
  }

  const data = await request.json();

  if (!data.pin || !data.email) {
    return new Response(JSON.stringify({ error: 'PIN and email required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Validate PIN format
  if (!/^\d{4}$/.test(data.pin)) {
    return new Response(JSON.stringify({ error: 'Invalid PIN format' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const listings = await getListingsByPinAndEmail(DB, data.pin, data.email);

  if (listings.length === 0) {
    return new Response(JSON.stringify({ error: 'No listings found with this PIN and email' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Return listings without sensitive data
  const safeListings = listings.map(l => ({
    id: l.id,
    make: l.make,
    model: l.model,
    year: l.year,
    price: l.price,
    kms: l.kms,
    location: l.location,
    description: l.description,
    photos: l.photos,
    photoUploaded: l.photoUploaded,
    url: `https://garage.co.nz/cars/${l.id}`
  }));

  return new Response(JSON.stringify({ listings: safeListings }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/api/listings/by-pin.ts
git commit -m "feat: add POST /api/listings/by-pin endpoint"
```

---

### Task 9: Create Edit Page /edit

**Files:**
- Create: `src/pages/edit.astro`

- [ ] **Step 1: Create the page**

```astro
---
import Layout from '../components/Layout.astro';
---

<Layout title="Edit Your Listing" description="Edit your car listing using your PIN">
  <section class="edit-page">
    <div id="pin-form" class="pin-form">
      <h1>Edit your listing</h1>
      <p class="subtitle">Enter your 4-digit PIN and email</p>

      <div class="form-group">
        <label for="email">Email</label>
        <input type="email" id="email" placeholder="your@email.com" required />
      </div>

      <div class="form-group">
        <label for="pin">PIN</label>
        <div class="pin-input">
          <input type="text" id="pin-1" maxlength="1" pattern="[0-9]" inputmode="numeric" />
          <input type="text" id="pin-2" maxlength="1" pattern="[0-9]" inputmode="numeric" />
          <input type="text" id="pin-3" maxlength="1" pattern="[0-9]" inputmode="numeric" />
          <input type="text" id="pin-4" maxlength="1" pattern="[0-9]" inputmode="numeric" />
        </div>
      </div>

      <button id="find-btn" class="find-btn">FIND LISTING</button>
      <p id="error" class="error"></p>
    </div>

    <div id="edit-form" class="edit-form" hidden>
      <h1 id="car-title"></h1>

      <div id="current-photo" class="current-photo"></div>

      <div class="form-group">
        <label for="change-photo">Change photo</label>
        <input type="file" id="change-photo" accept="image/*" />
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label for="edit-price">Price (NZD)</label>
          <input type="number" id="edit-price" min="0" />
        </div>
        <div class="form-group">
          <label for="edit-kms">Kilometers</label>
          <input type="number" id="edit-kms" min="0" />
        </div>
      </div>

      <div class="form-group">
        <label for="edit-location">Location</label>
        <input type="text" id="edit-location" />
      </div>

      <div class="form-group">
        <label for="edit-email">Contact email</label>
        <input type="email" id="edit-email" />
      </div>

      <div class="button-row">
        <button id="save-btn" class="save-btn">SAVE CHANGES</button>
        <button id="delete-btn" class="delete-btn">DELETE LISTING</button>
      </div>

      <p id="save-status" class="status"></p>
    </div>
  </section>
</Layout>

<script>
  const pinForm = document.getElementById('pin-form');
  const editForm = document.getElementById('edit-form');
  const findBtn = document.getElementById('find-btn');
  const errorEl = document.getElementById('error');
  const emailInput = document.getElementById('email');
  const pinInputs = [1, 2, 3, 4].map(i => document.getElementById(`pin-${i}`));

  let currentListing = null;
  let currentPin = '';

  // Auto-advance PIN inputs
  pinInputs.forEach((input, i) => {
    input.addEventListener('input', (e) => {
      const val = e.target.value.replace(/[^0-9]/g, '');
      e.target.value = val;
      if (val && i < 3) {
        pinInputs[i + 1].focus();
      }
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !e.target.value && i > 0) {
        pinInputs[i - 1].focus();
      }
    });
  });

  findBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const pin = pinInputs.map(i => i.value).join('');

    if (!email || pin.length !== 4) {
      errorEl.textContent = 'Please enter email and 4-digit PIN';
      return;
    }

    findBtn.disabled = true;
    findBtn.textContent = 'FINDING...';
    errorEl.textContent = '';

    try {
      const res = await fetch('/api/listings/by-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, email })
      });

      const data = await res.json();

      if (!res.ok) {
        errorEl.textContent = data.error || 'Not found';
        findBtn.disabled = false;
        findBtn.textContent = 'FIND LISTING';
        return;
      }

      // Use first listing (most common case)
      currentListing = data.listings[0];
      currentPin = pin;
      showEditForm(currentListing);

    } catch (err) {
      errorEl.textContent = 'Something went wrong';
      findBtn.disabled = false;
      findBtn.textContent = 'FIND LISTING';
    }
  });

  function showEditForm(listing) {
    pinForm.hidden = true;
    editForm.hidden = false;

    document.getElementById('car-title').textContent = `${listing.year} ${listing.make} ${listing.model}`;
    document.getElementById('edit-price').value = listing.price || '';
    document.getElementById('edit-kms').value = listing.kms || '';
    document.getElementById('edit-location').value = listing.location || '';
    document.getElementById('edit-email').value = emailInput.value;

    const photoContainer = document.getElementById('current-photo');
    if (listing.photos && listing.photos.length > 0) {
      photoContainer.innerHTML = `<img src="${listing.photos[0]}" alt="Current photo" />`;
    } else {
      photoContainer.innerHTML = '<p>No photo uploaded</p>';
    }
  }

  // Save changes
  document.getElementById('save-btn').addEventListener('click', async () => {
    const saveBtn = document.getElementById('save-btn');
    const statusEl = document.getElementById('save-status');

    saveBtn.disabled = true;
    saveBtn.textContent = 'SAVING...';
    statusEl.textContent = '';

    const updates = {
      pin: currentPin,
      price: parseInt(document.getElementById('edit-price').value) || 0,
      kms: parseInt(document.getElementById('edit-kms').value) || 0,
      location: document.getElementById('edit-location').value,
      sellerContact: { email: document.getElementById('edit-email').value }
    };

    // Handle photo change
    const photoInput = document.getElementById('change-photo');
    if (photoInput.files[0]) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        updates.photos = [e.target.result];
        await saveChanges(updates, saveBtn, statusEl);
      };
      reader.readAsDataURL(photoInput.files[0]);
    } else {
      await saveChanges(updates, saveBtn, statusEl);
    }
  });

  async function saveChanges(updates, saveBtn, statusEl) {
    try {
      const res = await fetch(`/api/listings/${currentListing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (res.ok) {
        statusEl.textContent = 'Saved!';
        statusEl.style.color = 'var(--color-primary)';
      } else {
        const data = await res.json();
        statusEl.textContent = data.error || 'Save failed';
        statusEl.style.color = '#e53935';
      }
    } catch (err) {
      statusEl.textContent = 'Save failed';
      statusEl.style.color = '#e53935';
    }

    saveBtn.disabled = false;
    saveBtn.textContent = 'SAVE CHANGES';
  }

  // Delete listing
  document.getElementById('delete-btn').addEventListener('click', async () => {
    if (!confirm('Delete this listing? This cannot be undone.')) return;

    const deleteBtn = document.getElementById('delete-btn');
    deleteBtn.disabled = true;
    deleteBtn.textContent = 'DELETING...';

    try {
      const res = await fetch(`/api/listings/${currentListing.id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        alert('Listing deleted');
        window.location.href = '/';
      } else {
        alert('Delete failed');
        deleteBtn.disabled = false;
        deleteBtn.textContent = 'DELETE LISTING';
      }
    } catch (err) {
      alert('Delete failed');
      deleteBtn.disabled = false;
      deleteBtn.textContent = 'DELETE LISTING';
    }
  });
</script>

<style>
  .edit-page {
    max-width: 400px;
    margin: 2rem auto;
    padding: 0 1rem;
  }

  .pin-form, .edit-form {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    padding: 2rem;
  }

  h1 {
    font-size: 1.25rem;
    margin: 0 0 0.5rem 0;
  }

  .subtitle {
    color: var(--color-text-muted);
    margin: 0 0 2rem 0;
    font-size: 0.875rem;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  .form-group label {
    display: block;
    font-size: 0.75rem;
    color: var(--color-text-muted);
    margin-bottom: 0.5rem;
  }

  .form-group input {
    width: 100%;
    padding: 0.75rem;
    font-family: inherit;
    font-size: 1rem;
    border: 1px solid var(--color-border);
    background: var(--color-bg);
  }

  .pin-input {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
  }

  .pin-input input {
    width: 3rem;
    height: 3rem;
    text-align: center;
    font-size: 1.5rem;
    font-weight: 600;
  }

  .find-btn, .save-btn {
    width: 100%;
    padding: 1rem;
    background: var(--color-primary);
    color: white;
    border: none;
    font-family: inherit;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
  }

  .find-btn:disabled, .save-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .error {
    color: #e53935;
    text-align: center;
    margin-top: 1rem;
    font-size: 0.875rem;
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .current-photo {
    margin-bottom: 1.5rem;
  }

  .current-photo img {
    width: 100%;
    max-height: 200px;
    object-fit: cover;
  }

  .current-photo p {
    color: var(--color-text-muted);
    text-align: center;
  }

  .button-row {
    display: flex;
    gap: 1rem;
  }

  .delete-btn {
    flex: 1;
    padding: 1rem;
    background: #fee2e2;
    color: #dc2626;
    border: none;
    font-family: inherit;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
  }

  .save-btn {
    flex: 2;
  }

  .status {
    text-align: center;
    margin-top: 1rem;
    font-size: 0.875rem;
  }

  input[type="file"] {
    font-size: 0.875rem;
  }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/edit.astro
git commit -m "feat: add PIN-based edit page /edit"
```

---

### Task 10: Update llms.txt with Listing Workflow

**Files:**
- Modify: `public/llms.txt`

- [ ] **Step 1: Add the listing creation workflow section**

Replace the existing "Adding a listing" section with:

```markdown
## Creating a Listing (for AI agents helping users)

When a user wants to list a car, follow this conversational flow:

### Step 1: Collect details (one at a time, conversationally)

Ask for:
1. Make and model (e.g., "Toyota Corolla")
2. Year (e.g., 2018)
3. Kilometers (e.g., 85000)
4. Price in NZD (e.g., 15000)
5. Location/city (e.g., Auckland)
6. Contact email (for buyers to reach them)
7. A 4-digit PIN (they'll use this to edit their listing later)

### Step 2: Create the listing

POST https://garage.co.nz/api/listings
Content-Type: application/json

```json
{
  "make": "Toyota",
  "model": "Corolla",
  "year": 2018,
  "kms": 85000,
  "price": 15000,
  "location": "Auckland",
  "sellerContact": { "email": "seller@email.com" },
  "pin": "1234"
}
```

Response:
```json
{
  "success": true,
  "listing": {
    "id": "toyota-2018-1234567890",
    "url": "https://garage.co.nz/cars/toyota-2018-1234567890",
    "uploadCode": "x7k9",
    "uploadUrl": "https://garage.co.nz/u/x7k9"
  }
}
```

### Step 3: Photo upload

Tell the user:
"Almost done! Upload your photo here: garage.co.nz/u/{uploadCode}
Let me know when you're done."

The user will click the link, upload their photo, and see a success message.

### Step 4: Confirm the listing is live

When the user says they're done, check the status:

GET https://garage.co.nz/api/listings/status/{uploadCode}

Response:
```json
{
  "id": "toyota-2018-1234567890",
  "photoUploaded": true,
  "url": "https://garage.co.nz/cars/toyota-2018-1234567890"
}
```

If `photoUploaded` is true, tell them:
"Your car is live at {url}!
Use your PIN at garage.co.nz/edit to make changes anytime."

If `photoUploaded` is false, say:
"I don't see the photo yet. Try the upload link again: garage.co.nz/u/{uploadCode}"

### Example conversation

User: "I want to list my car on garage.co.nz"
AI: "I can help with that! What's the make and model?"
User: "2018 Toyota Corolla"
AI: "Great! How many kilometers?"
User: "85000"
AI: "What price are you asking? (in NZD)"
User: "15000"
AI: "Which city?"
User: "Auckland"
AI: "What's your email for buyers to contact you?"
User: "ben@email.com"
AI: "Last thing - choose a 4-digit PIN. You'll use this to edit your listing later."
User: "1234"
AI: [calls API, creates listing]
AI: "Almost done! Upload your photo here: garage.co.nz/u/x7k9 - let me know when you're done."
User: [uploads photo] "done"
AI: [checks status]
AI: "Your Corolla is live! View it at garage.co.nz/cars/toyota-2018-abc123
     Use PIN 1234 at garage.co.nz/edit to make changes anytime."
```

- [ ] **Step 2: Commit**

```bash
git add public/llms.txt
git commit -m "docs: add conversational listing workflow to llms.txt"
```

---

### Task 11: Add AI Hint to Homepage

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Add HTML comment for AI agents**

Near the top of the `<body>` content (inside the Layout), add:

```html
<!-- AI agents: For listing creation workflow, read /llms.txt -->
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat: add AI hint comment to homepage"
```

---

### Task 12: Final Integration Test

**Files:**
- None (manual testing)

- [ ] **Step 1: Deploy to Cloudflare**

```bash
git push
```

Wait for Cloudflare Pages to deploy.

- [ ] **Step 2: Test the full flow**

1. Open ChatGPT
2. Say "I want to list my car on garage.co.nz"
3. Verify ChatGPT reads llms.txt and follows the conversational flow
4. Complete the conversation (provide make, model, year, kms, price, location, email, PIN)
5. Click the upload link
6. Upload a photo
7. Verify success page shows
8. Tell ChatGPT "done"
9. Verify ChatGPT confirms the listing
10. Visit /edit, enter PIN + email, verify you can edit

- [ ] **Step 3: Test edge cases**

- Invalid upload code → should redirect to /sell
- Already uploaded photo → should redirect to listing
- Wrong PIN → should show error
- Rate limiting → 6th attempt should fail

---

## Summary

| Task | Description |
|------|-------------|
| 1 | Update listings.ts with new fields and functions |
| 2 | Run D1 migration to add columns |
| 3 | Modify POST /api/listings to accept PIN, return uploadCode, add rate limiting |
| 4 | Modify PATCH/DELETE /api/listings/[id] to require PIN auth |
| 5 | Create GET /api/listings/status/[uploadCode] |
| 6 | Create POST /api/upload/[uploadCode] |
| 7 | Create upload page /u/[code] |
| 8 | Create POST /api/listings/by-pin |
| 9 | Create edit page /edit |
| 10 | Update llms.txt with workflow |
| 11 | Add AI hint to homepage |
| 12 | Deploy and test |
