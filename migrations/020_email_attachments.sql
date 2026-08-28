-- What people actually sent, not just what they typed.
--
-- Attachments were parsed and thrown away, so a CV arrived as a subject line
-- about a CV and nothing else. Stored as JSON here — name, type, size and the
-- R2 key — because a handful of files per email does not warrant a table.

ALTER TABLE emails ADD COLUMN attachments TEXT;
