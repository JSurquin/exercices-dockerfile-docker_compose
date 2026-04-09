-- Add contactEmail column to user table
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "contactEmail" TEXT;
