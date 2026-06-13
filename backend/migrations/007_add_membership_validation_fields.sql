-- Add last_payment and gender columns to members table for membership validation
ALTER TABLE members ADD COLUMN last_payment TEXT;
ALTER TABLE members ADD COLUMN gender TEXT;
