-- Add source tracking for external listings (Trade Me, etc.)
ALTER TABLE listings ADD COLUMN source TEXT DEFAULT 'garage';
ALTER TABLE listings ADD COLUMN source_url TEXT;

-- Index for filtering by source
CREATE INDEX IF NOT EXISTS idx_listings_source ON listings(source);
