-- Enquiries from the cart on a published site. Deliberately not orders in the
-- payment sense: no card details are collected anywhere, a person checks stock
-- and gets in touch to take payment.
CREATE TABLE IF NOT EXISTS orders (
  id           TEXT PRIMARY KEY,
  slug         TEXT NOT NULL,
  name         TEXT,
  email        TEXT,
  phone        TEXT,
  note         TEXT,
  items        TEXT NOT NULL,      -- JSON: [{name, price, qty}]
  total        TEXT,
  status       TEXT NOT NULL DEFAULT 'new',
  created_at   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_slug ON orders(slug, created_at);
