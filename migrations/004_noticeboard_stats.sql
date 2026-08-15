-- Add views and hearts to noticeboard
ALTER TABLE noticeboard ADD COLUMN views INTEGER DEFAULT 0;
ALTER TABLE noticeboard ADD COLUMN hearts INTEGER DEFAULT 0;
