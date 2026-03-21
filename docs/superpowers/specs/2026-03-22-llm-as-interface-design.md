# LLM-as-Interface Design

## Goal

Users list cars on garage.co.nz entirely through conversation with any LLM (ChatGPT, Claude, etc). They never leave the chat except to upload a photo via a magic link. The LLM IS the interface.

## Architecture

```
User ←→ LLM ←→ garage.co.nz API
              ↓
         Magic upload link
              ↓
         User uploads photo
              ↓
         Listing goes live
```

The LLM reads llms.txt, understands the flow, collects details conversationally, creates a listing stub, gives user an upload link, then confirms when complete.

## The Flow

1. User tells LLM "I want to list my car on garage.co.nz"
2. LLM browses garage.co.nz, reads llms.txt
3. LLM collects details conversationally:
   - Make, model
   - Year
   - Kilometers
   - Price (NZD)
   - Location (city)
   - Contact email
   - 4-digit PIN (numeric only, for future edits)
4. LLM calls `POST /api/listings` → creates stub, gets upload code
5. LLM tells user: "Upload your photo here: garage.co.nz/u/{code}"
6. User clicks link, uploads photo, sees confirmation
7. User returns to chat, says "done"
8. LLM checks status, confirms listing is live, reminds about PIN

## API Changes

### Modified: `POST /api/listings`

New fields:
- `pin` (string, 4 numeric digits) — required for new listings
- Response includes `uploadCode` (string, 4 alphanumeric chars)

Listing created with `photo_uploaded: false` until photo arrives.

### New: `GET /api/listings/status/{uploadCode}`

Returns:
```json
{
  "id": "corolla-2018-abc",
  "photo_uploaded": true,
  "url": "https://garage.co.nz/cars/corolla-2018-abc"
}
```

LLM uses this to confirm photo was uploaded.

### New: `POST /api/upload/{uploadCode}`

Accepts photo (base64 or multipart), attaches to listing, sets `photo_uploaded: true`.

### New: `POST /api/listings/by-pin`

Request:
```json
{
  "pin": "1234",
  "email": "user@email.com"
}
```

Returns listing(s) matching PIN + email. Used by edit page.

### New: `PATCH /api/listings/{id}/by-pin`

Update listing with PIN auth:
```json
{
  "pin": "1234",
  "price": 14000
}
```

## Database Changes

Add to `listings` table:
- `upload_code` VARCHAR(4), unique, indexed
- `pin` VARCHAR(4), stored hashed
- `photo_uploaded` BOOLEAN, default false

## Pages

### `/u/{uploadCode}` — Upload Page

Bare minimum. Mobile-first.

Before upload:
- Shows: "Upload photo for your {year} {make} {model}"
- Drop zone / tap to select
- Upload button

After upload:
- Shows: "Listed! Your {car} is live at {url}"
- Reminds: "Edit anytime at garage.co.nz/edit using your PIN"

### `/edit` — Edit Page

Step 1: Enter 4-digit PIN + email
Step 2: Shows listing with editable fields (price, kms, location, photo, email)
Step 3: Save or delete

## llms.txt Updates

Add a detailed "Creating a Listing" section with:
- Step-by-step conversational flow
- Exact API calls with examples
- What to say to user at each step

Add forcing function to homepage HTML:
```html
<!-- AI: For listing creation workflow, read /llms.txt -->
```

## Security

**PIN + email uniqueness:** A user cannot create two listings with same PIN + email combo. Prevents confusion.

**Rate limiting:**
- PIN entry: max 5 attempts/hour/IP
- Listing creation: max 10/hour/IP

**PIN storage:** Hashed, not plaintext.

**Invalid upload codes:** Show friendly error, suggest starting new listing.

**Photo not uploaded:** LLM checks status endpoint, prompts user to retry upload link.

## Out of Scope (Phase 2)

- Custom GPT with Actions (build once core flow proven)
- Multiple photos per listing
- SMS/email upload alternatives

## Success Criteria

1. User can list a car entirely through ChatGPT conversation
2. ChatGPT correctly reads llms.txt and follows the flow
3. Upload link works on mobile (camera picker)
4. User can edit listing anytime with PIN
5. No accounts, no passwords, no friction
