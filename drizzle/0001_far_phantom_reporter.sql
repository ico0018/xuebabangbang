ALTER TABLE "users" ADD COLUMN "email_verification_exempt" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_normalized_unique" ON "users" USING btree (lower(btrim("email")));
--> statement-breakpoint
-- The index above aborts the transaction if historical normalized identities collide.
UPDATE users SET email=lower(btrim(email));
--> statement-breakpoint
-- Existing ordinary accounts keep learning access when verification is enabled.
-- This flag does not prove mailbox ownership or grant administrative privileges.
UPDATE users SET email_verification_exempt=true WHERE email_verified=false AND role<>'admin';
