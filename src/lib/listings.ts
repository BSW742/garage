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
  };
}

export async function getAllListings(db: D1Database): Promise<Listing[]> {
  const result = await db
    .prepare('SELECT * FROM listings ORDER BY created_at DESC')
    .all<DBRow>();
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
  let query = 'SELECT * FROM listings WHERE 1=1';
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

export async function addListing(
  db: D1Database,
  listing: Omit<Listing, 'id' | 'createdAt'>
): Promise<Listing> {
  const id = `${listing.make.toLowerCase()}-${listing.year}-${Date.now()}`;
  const createdAt = new Date().toISOString();

  await db
    .prepare(`
      INSERT INTO listings (id, make, model, year, kms, price, location, description, photos, seller_email, seller_phone, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      id,
      listing.make,
      listing.model,
      listing.year,
      listing.kms,
      listing.price,
      listing.location,
      listing.description,
      JSON.stringify(listing.photos),
      listing.sellerContact.email,
      listing.sellerContact.phone || null,
      createdAt
    )
    .run();

  return {
    ...listing,
    id,
    createdAt,
  };
}
