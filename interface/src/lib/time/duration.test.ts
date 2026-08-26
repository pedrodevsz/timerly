import { describe, expect, it } from "vitest";
import { calculateLongestStreak, calculateStreak, runningDuration, startOfLocalDay } from "./duration";

describe("study time calculations", () => {
  it("adds the current active interval to accumulated time", () => {
    const resumedAt = new Date("2026-08-26T12:00:00Z");
    expect(runningDuration(120, resumedAt, new Date("2026-08-26T12:03:30Z"))).toBe(330);
  });

  it("does not change a paused duration", () => {
    expect(runningDuration(900, null, new Date("2026-08-26T12:00:00Z"))).toBe(900);
  });

  it("calculates current and longest streaks from unique days", () => {
    const days = ["2026-08-20", "2026-08-21", "2026-08-24", "2026-08-25", "2026-08-26", "2026-08-26"];
    expect(calculateStreak(days, "2026-08-26")).toBe(3);
    expect(calculateLongestStreak(days)).toBe(3);
  });

  it("uses the configured timezone to determine the study day", () => {
    expect(startOfLocalDay(new Date("2026-08-26T01:00:00Z"), "America/Sao_Paulo")).toBe("2026-08-25");
  });
});
