-- Reply failures were only ever logged to the console, so a missing
-- confirmation left no trace anywhere we could look.
ALTER TABLE site_mail ADD COLUMN reply_error TEXT;
