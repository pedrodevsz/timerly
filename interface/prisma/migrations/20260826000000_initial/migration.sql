CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED');

CREATE TABLE "projects" (
  "id" UUID NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "description" VARCHAR(600) NOT NULL DEFAULT '',
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "subjects" (
  "id" UUID NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "project_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "topics" (
  "id" SERIAL NOT NULL,
  "name" VARCHAR(180) NOT NULL,
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "subject_id" UUID NOT NULL,
  CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "study_sessions" (
  "id" SERIAL NOT NULL,
  "topic_id" INTEGER NOT NULL,
  "started_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_resumed_at" TIMESTAMPTZ(3),
  "ended_at" TIMESTAMPTZ(3),
  "duration_seconds" INTEGER NOT NULL DEFAULT 0,
  "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT "study_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_settings" (
  "id" VARCHAR(40) NOT NULL DEFAULT 'local',
  "name" VARCHAR(120) NOT NULL DEFAULT 'Pedro Santos',
  "email" VARCHAR(255) NOT NULL DEFAULT 'pedro@email.com',
  "daily_goal_minutes" INTEGER NOT NULL DEFAULT 120,
  "timezone" VARCHAR(80) NOT NULL DEFAULT 'America/Sao_Paulo',
  "timer_sounds" BOOLEAN NOT NULL DEFAULT false,
  "daily_reminder" BOOLEAN NOT NULL DEFAULT true,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "subjects_project_id_name_key" ON "subjects"("project_id", "name");
CREATE INDEX "subjects_project_id_idx" ON "subjects"("project_id");
CREATE UNIQUE INDEX "topics_subject_id_name_key" ON "topics"("subject_id", "name");
CREATE INDEX "topics_subject_id_idx" ON "topics"("subject_id");
CREATE INDEX "study_sessions_topic_id_idx" ON "study_sessions"("topic_id");
CREATE INDEX "study_sessions_status_idx" ON "study_sessions"("status");
CREATE INDEX "study_sessions_started_at_idx" ON "study_sessions"("started_at");
CREATE UNIQUE INDEX "study_sessions_single_open_idx" ON "study_sessions" ((1)) WHERE "status" IN ('ACTIVE', 'PAUSED');

ALTER TABLE "subjects" ADD CONSTRAINT "subjects_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "topics" ADD CONSTRAINT "topics_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
