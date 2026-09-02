import { describe, expect, it } from "vitest";
import { createProjectSchema } from "./projects/project.schema";
import { updateStudySessionSchema } from "./study-sessions/study-session.schema";
import { updateSettingsSchema } from "./settings/settings.schema";

describe("API input validation", () => {
  it("trims valid projects and rejects empty names", () => {
    expect(createProjectSchema.parse({ name: "  ENEM 2027  " })).toEqual({ name: "ENEM 2027", description: "" });
    expect(createProjectSchema.safeParse({ name: " " }).success).toBe(false);
  });

  it("rejects changing the topic of an active session", () => {
    expect(updateStudySessionSchema.safeParse({ action: "change-topic" }).success).toBe(false);
    expect(updateStudySessionSchema.safeParse({ action: "change-topic", topicId: 7 }).success).toBe(false);
  });

  it("accepts an ISO timestamp and rejects an invalid transition timestamp", () => {
    expect(
      updateStudySessionSchema.safeParse({
        action: "pause",
        occurredAt: "2026-09-02T10:00:10.000Z",
      }).success,
    ).toBe(true);
    expect(
      updateStudySessionSchema.safeParse({
        action: "pause",
        occurredAt: "not-a-date",
      }).success,
    ).toBe(false);
  });

  it("rejects unsafe preference values", () => {
    expect(updateSettingsSchema.safeParse({ dailyGoalMinutes: -20 }).success).toBe(false);
    expect(updateSettingsSchema.safeParse({ email: "not-an-email" }).success).toBe(false);
  });
});
