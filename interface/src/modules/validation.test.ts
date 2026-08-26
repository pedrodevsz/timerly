import { describe, expect, it } from "vitest";
import { createProjectSchema } from "./projects/project.schema";
import { updateStudySessionSchema } from "./study-sessions/study-session.schema";
import { updateSettingsSchema } from "./settings/settings.schema";

describe("API input validation", () => {
  it("trims valid projects and rejects empty names", () => {
    expect(createProjectSchema.parse({ name: "  ENEM 2027  " })).toEqual({ name: "ENEM 2027", description: "" });
    expect(createProjectSchema.safeParse({ name: " " }).success).toBe(false);
  });

  it("requires a topic when changing the active session", () => {
    expect(updateStudySessionSchema.safeParse({ action: "change-topic" }).success).toBe(false);
    expect(updateStudySessionSchema.safeParse({ action: "change-topic", topicId: 7 }).success).toBe(true);
  });

  it("rejects unsafe preference values", () => {
    expect(updateSettingsSchema.safeParse({ dailyGoalMinutes: -20 }).success).toBe(false);
    expect(updateSettingsSchema.safeParse({ email: "not-an-email" }).success).toBe(false);
  });
});
