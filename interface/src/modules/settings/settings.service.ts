import type { UserSettingsDto } from "@/types/domain";
import { settingsRepository } from "./settings.repository";
import type { UpdateSettingsInput } from "./settings.schema";

function dto(settings: Awaited<ReturnType<typeof settingsRepository.get>>): UserSettingsDto { return { name: settings.name, email: settings.email, dailyGoalMinutes: settings.dailyGoalMinutes, timezone: settings.timezone, timerSounds: settings.timerSounds, dailyReminder: settings.dailyReminder }; }
export const settingsService = { async get() { return dto(await settingsRepository.get()); }, async update(input: UpdateSettingsInput) { return dto(await settingsRepository.update(input)); } };
