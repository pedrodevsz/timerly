import { getPrisma } from "@/lib/db/prisma";
import type { UpdateSettingsInput } from "./settings.schema";

const defaults = { id: "local", name: "Pedro Santos", email: "pedro@email.com", dailyGoalMinutes: 120, timezone: "America/Sao_Paulo", timerSounds: false, dailyReminder: true };
export const settingsRepository = {
  get: () => getPrisma().userSettings.upsert({ where: { id: "local" }, create: defaults, update: {} }),
  update: (data: UpdateSettingsInput) => getPrisma().userSettings.upsert({ where: { id: "local" }, create: { ...defaults, ...data }, update: data }),
};
