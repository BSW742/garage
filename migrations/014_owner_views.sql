-- Did the owner actually look at what we sent them.
--
-- The signal comes from a token only they were given, so a visit through the
-- email is distinguishable from someone stumbling on the site. An email-open
-- pixel would be easier and close to worthless: Apple Mail pre-fetches images,
-- so opens read as high whether or not a human ever saw it.

ALTER TABLE site_claims ADD COLUMN view_token TEXT;
ALTER TABLE site_claims ADD COLUMN owner_seen_at TEXT;        -- first look
ALTER TABLE site_claims ADD COLUMN owner_seen_last TEXT;      -- most recent
ALTER TABLE site_claims ADD COLUMN owner_seen_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE site_claims ADD COLUMN editor_opened_at TEXT;     -- they went further
