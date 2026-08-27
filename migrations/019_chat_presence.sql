-- Whether the owner is actually at their inbox right now.
--
-- A boolean would be wrong. Somebody flips "online", shuts the laptop, and
-- every visitor after that is promised a live person who is not there — which
-- is worse than saying nobody is about. So this is a heartbeat: the inbox
-- stamps it while it is open, and "online" means the stamp is fresh.

ALTER TABLE site_claims ADD COLUMN chat_online_at TEXT;
