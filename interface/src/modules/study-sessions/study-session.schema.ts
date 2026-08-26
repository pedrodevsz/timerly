import { z } from "zod";

export const sessionIdSchema = z.coerce.number().int().positive("ID de sessão inválido.");
export const createStudySessionSchema = z.object({ topicId: z.number().int().positive() });
export const updateStudySessionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("pause") }),
  z.object({ action: z.literal("resume") }),
  z.object({ action: z.literal("stop") }),
  z.object({ action: z.literal("change-topic"), topicId: z.number().int().positive() }),
]);
export type CreateStudySessionInput = z.infer<typeof createStudySessionSchema>;
export type UpdateStudySessionInput = z.infer<typeof updateStudySessionSchema>;
