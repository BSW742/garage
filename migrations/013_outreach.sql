-- First contact with a business owner who has never heard of us, and what
-- came of it. Kept on the site row because there is one offer per site.
--
-- unsub_token is deliberately NOT the edit token: an unsubscribe link gets
-- forwarded, printed and pasted into group chats, and the edit token is the
-- key to the whole site.

ALTER TABLE site_claims ADD COLUMN owner_sent_at TEXT;
ALTER TABLE site_claims ADD COLUMN owner_sent_to TEXT;
ALTER TABLE site_claims ADD COLUMN claimed_at TEXT;
ALTER TABLE site_claims ADD COLUMN unsubscribed_at TEXT;
ALTER TABLE site_claims ADD COLUMN unsub_token TEXT;
