import { z } from "zod";

export const updateSettingsSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  email: z.email().max(255).optional(),
  dailyGoalMinutes: z.number().int().min(15).max(1440).optional(),
  timezone: z.string().trim().min(3).max(80).optional(),
  timerSounds: z.boolean().optional(),
  dailyReminder: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0, "Informe ao menos um campo.");
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
