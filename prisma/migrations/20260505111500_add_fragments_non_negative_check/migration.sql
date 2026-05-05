-- Fix any existing negative fragments before adding the constraint
UPDATE "user" SET "fragments" = 0 WHERE "fragments" < 0;

-- Prevent fragments from going negative via concurrent requests
ALTER TABLE "user" ADD CONSTRAINT "user_fragments_non_negative" CHECK ("fragments" >= 0);
