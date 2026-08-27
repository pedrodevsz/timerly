import { getPrisma } from "@/lib/db/prisma";
import type { UpdateSettingsInput } from "./settings.schema";

const defaults = {
  name: "Usuário",
  email: "",
  dailyGoalMinutes: 120,
  timezone: "America/Sao_Paulo",
  timerSounds: false,
  dailyReminder: true,
};
const include = { user: { select: { name: true, email: true } } } as const;

export const settingsRepository = {
  get: (userId: string) =>
    getPrisma().userSettings.upsert({
      where: { userId },
      create: { ...defaults, userId },
      update: {},
      include,
    }),
  update: async (userId: string, data: UpdateSettingsInput) => {
    const { name, email, ...preferences } = data;
    return getPrisma().$transaction(async (transaction) => {
      if (name !== undefined || email !== undefined) {
        await transaction.user.update({
          where: { id: userId },
          data: { name, email: email?.trim().toLowerCase() },
        });
      }
      return transaction.userSettings.upsert({
        where: { userId },
        create: { ...defaults, ...preferences, userId },
        update: preferences,
        include,
      });
    });
  },
};
