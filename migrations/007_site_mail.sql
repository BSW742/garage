-- Every email sent to <slug>@garage.co.nz, whether or not it changed anything.
-- Doubles as the audit trail and the undo point.

CREATE TABLE IF NOT EXISTS site_mail (
  id           TEXT PRIMARY KEY,
  slug         TEXT NOT NULL,
  from_address TEXT NOT NULL,
  subject      TEXT,
  message_id   TEXT,            -- mail servers retry; dedupe on this
  auth_result  TEXT,            -- what SPF/DKIM/DMARC said, kept for disputes
  intent       TEXT,            -- gallery | rejected | held
  applied      INTEGER NOT NULL DEFAULT 0,
  prev_config  TEXT,            -- verbatim snapshot, so undo is a restore
  undo_token   TEXT,
  note         TEXT,            -- what we told the sender
  received_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_site_mail_slug ON site_mail(slug, received_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_site_mail_msgid ON site_mail(message_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_site_mail_undo ON site_mail(undo_token);
