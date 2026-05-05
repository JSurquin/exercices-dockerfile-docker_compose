-- Prevent fragments from going negative via concurrent requests
ALTER TABLE "user" ADD CONSTRAINT "user_fragments_non_negative" CHECK ("fragments" >= 0);
