-- Extra free tokens on top of the standing allowance.
--
-- Kept as a ledger rather than a running total on site_claims: the meter has
-- to be able to say where the tokens came from, and a number you cannot
-- explain is a number people stop trusting.

CREATE TABLE IF NOT EXISTS token_grants (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL,                       -- who the tokens are for
  tokens INTEGER NOT NULL,
  reason TEXT NOT NULL,                     -- referral | welcome | manual
  ref_slug TEXT,                            -- the site this grant came from
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_grants_slug ON token_grants(slug);

-- Who put this business forward, and whether that has been paid out. The paid
-- column is what stops a second claim paying a second time.
ALTER TABLE site_claims ADD COLUMN referred_by TEXT;
ALTER TABLE site_claims ADD COLUMN referral_paid_at TEXT;
