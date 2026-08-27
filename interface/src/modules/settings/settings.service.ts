import type { UserSettingsDto } from "@/types/domain";
import { settingsRepository } from "./settings.repository";
import type { UpdateSettingsInput } from "./settings.schema";

function dto(
  settings: Awaited<ReturnType<typeof settingsRepository.get>>,
): UserSettingsDto {
  return {
    name: settings.user.name,
    email: settings.user.email,
    dailyGoalMinutes: settings.dailyGoalMinutes,
    timezone: settings.timezone,
    timerSounds: settings.timerSounds,
    dailyReminder: settings.dailyReminder,
  };
}

export const settingsService = {
  async get(userId: string) {
    return dto(await settingsRepository.get(userId));
  },
  async update(userId: string, input: UpdateSettingsInput) {
    return dto(await settingsRepository.update(userId, input));
  },
};
