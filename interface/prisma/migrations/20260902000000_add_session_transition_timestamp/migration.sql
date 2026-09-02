ALTER TABLE "study_sessions"
ADD COLUMN "last_transition_at" TIMESTAMPTZ(3);

UPDATE "study_sessions"
SET "last_transition_at" = COALESCE("ended_at", "last_resumed_at", "started_at");

ALTER TABLE "study_sessions"
ALTER COLUMN "last_transition_at" SET NOT NULL;
