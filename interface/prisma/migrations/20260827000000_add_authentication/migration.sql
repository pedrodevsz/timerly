CREATE TABLE "users" (
  "id" UUID NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "email" VARCHAR(255) NOT NULL,
  "password_hash" VARCHAR(255),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

INSERT INTO "users" ("id", "name", "email", "updated_at")
VALUES (
  '00000000-0000-4000-8000-000000000001',
  COALESCE((SELECT "name" FROM "user_settings" LIMIT 1), 'Usuário legado'),
  LOWER(BTRIM(COALESCE((SELECT "email" FROM "user_settings" LIMIT 1), 'legacy@orbe.invalid'))),
  CURRENT_TIMESTAMP
);

CREATE TABLE "auth_sessions" (
  "id" UUID NOT NULL,
  "token_hash" CHAR(64) NOT NULL,
  "user_id" UUID NOT NULL,
  "expires_at" TIMESTAMPTZ(3) NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "projects" ADD COLUMN "user_id" UUID;
ALTER TABLE "study_sessions" ADD COLUMN "user_id" UUID;
ALTER TABLE "user_settings" ADD COLUMN "user_id" UUID;

UPDATE "projects"
SET "user_id" = '00000000-0000-4000-8000-000000000001';

UPDATE "study_sessions"
SET "user_id" = '00000000-0000-4000-8000-000000000001';

UPDATE "user_settings"
SET "user_id" = '00000000-0000-4000-8000-000000000001';

ALTER TABLE "projects" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "study_sessions" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "user_settings" ALTER COLUMN "user_id" SET NOT NULL;

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_email_normalized_key" ON "users"(LOWER("email"));
CREATE UNIQUE INDEX "auth_sessions_token_hash_key" ON "auth_sessions"("token_hash");
CREATE INDEX "auth_sessions_user_id_idx" ON "auth_sessions"("user_id");
CREATE INDEX "auth_sessions_expires_at_idx" ON "auth_sessions"("expires_at");
CREATE INDEX "projects_user_id_idx" ON "projects"("user_id");
CREATE INDEX "study_sessions_user_id_idx" ON "study_sessions"("user_id");
CREATE UNIQUE INDEX "user_settings_user_id_key" ON "user_settings"("user_id");

DROP INDEX "study_sessions_single_open_idx";
CREATE UNIQUE INDEX "study_sessions_single_open_per_user_idx"
ON "study_sessions" ("user_id")
WHERE "status" IN ('ACTIVE', 'PAUSED');

ALTER TABLE "auth_sessions"
ADD CONSTRAINT "auth_sessions_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "projects"
ADD CONSTRAINT "projects_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "study_sessions"
ADD CONSTRAINT "study_sessions_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_settings"
ADD CONSTRAINT "user_settings_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
