export interface Listing {
  id: string;
  make: string;
  model: string;
  year: number;
  kms: number;
  price: number;
  location: string;
  description: string;
  photos: string[];
  sellerContact: {
    email: string;
    phone?: string;
  };
  createdAt: string;
  source: 'garage' | 'trademe';
  sourceUrl?: string;
  uploadCode?: string;
  pin?: string;  // stored hashed
  photoUploaded: boolean;
}

export interface FilterOptions {
  location?: string;
  maxPrice?: number;
  minPrice?: number;
  make?: string;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T = unknown>(): Promise<D1Result<T>>;
  first<T = unknown>(): Promise<T | null>;
  run(): Promise<D1Result<unknown>>;
}

interface D1Result<T> {
  results: T[];
  success: boolean;
}

interface DBRow {
  id: string;
  make: string;
  model: string;
  year: number;
  kms: number;
  price: number;
  location: string;
  description: string;
  photos: string;
  seller_email: string;
  seller_phone: string | null;
  created_at: string;
  source: string | null;
  source_url: string | null;
  upload_code: string | null;
  pin: string | null;
  photo_uploaded: number;  // SQLite uses 0/1 for boolean
}

function rowToListing(row: DBRow): Listing {
  return {
    id: row.id,
    make: row.make,
    model: row.model,
    year: row.year,
    kms: row.kms,
    price: row.price,
    location: row.location,
    description: row.description,
    photos: JSON.parse(row.photos),
    sellerContact: {
      email: row.seller_email,
      phone: row.seller_phone || undefined,
    },
    createdAt: row.created_at,
    source: (row.source as 'garage' | 'trademe') || 'garage',
    sourceUrl: row.source_url || undefined,
    uploadCode: row.upload_code || undefined,
    pin: row.pin || undefined,
    photoUploaded: row.photo_uploaded === 1,
  };
}

export async function getAllListings(db: D1Database, includeIncomplete = false): Promise<Listing[]> {
  const query = includeIncomplete
    ? 'SELECT * FROM listings ORDER BY created_at DESC'
    : 'SELECT * FROM listings WHERE price > 0 ORDER BY created_at DESC';
  const result = await db.prepare(query).all<DBRow>();
  return result.results.map(rowToListing);
}

export async function getListingById(db: D1Database, id: string): Promise<Listing | null> {
  const row = await db
    .prepare('SELECT * FROM listings WHERE id = ?')
    .bind(id)
    .first<DBRow>();
  return row ? rowToListing(row) : null;
}

export async function filterListings(db: D1Database, options: FilterOptions): Promise<Listing[]> {
  // Always exclude incomplete listings (price = 0)
  let query = 'SELECT * FROM listings WHERE price > 0';
  const params: unknown[] = [];

  if (options.location) {
    query += ' AND LOWER(location) = LOWER(?)';
    params.push(options.location);
  }
  if (options.maxPrice) {
    query += ' AND price <= ?';
    params.push(options.maxPrice);
  }
  if (options.minPrice) {
    query += ' AND price >= ?';
    params.push(options.minPrice);
  }
  if (options.make) {
    query += ' AND LOWER(make) = LOWER(?)';
    params.push(options.make);
  }

  query += ' ORDER BY created_at DESC';

  let stmt = db.prepare(query);
  if (params.length > 0) {
    stmt = stmt.bind(...params);
  }

  const result = await stmt.all<DBRow>();
  return result.results.map(rowToListing);
}

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

export async function markPhotoUploaded(db: D1Database, uploadCode: string, photoUrl: string): Promise<boolean> {
  const result = await db.prepare(`
    UPDATE listings SET photos = ?, photo_uploaded = 1 WHERE upload_code = ?
  `).bind(JSON.stringify([photoUrl]), uploadCode).run();
  return result.success;
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

export async function addListing(db: D1Database, listing: Partial<Listing>): Promise<{ id: string; uploadCode: string }> {
  const id = listing.source === 'trademe'
    ? `tm-${listing.make?.toLowerCase()}-${listing.year}-${Date.now()}`
    : `${listing.make?.toLowerCase()}-${listing.year}-${Date.now()}`;
  const hashedPin = listing.pin ? await hashPin(listing.pin) : null;

  // Retry up to 5 times if upload code collision
  for (let attempt = 0; attempt < 5; attempt++) {
    const uploadCode = generateUploadCode();
    try {
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
        0
      ).run();
      return { id, uploadCode };
    } catch (error) {
      if (attempt === 4) throw error;
      // Retry with new upload code
    }
  }
  throw new Error('Failed to generate unique upload code');
}
