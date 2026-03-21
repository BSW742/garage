-- Listings table for garage.co.nz
CREATE TABLE IF NOT EXISTS listings (
  id TEXT PRIMARY KEY,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  kms INTEGER NOT NULL,
  price INTEGER NOT NULL,
  location TEXT NOT NULL,
  description TEXT NOT NULL,
  photos TEXT NOT NULL, -- JSON array
  seller_email TEXT NOT NULL,
  seller_phone TEXT,
  created_at TEXT NOT NULL
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_listings_location ON listings(location);
CREATE INDEX IF NOT EXISTS idx_listings_make ON listings(make);
CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(price);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at);
