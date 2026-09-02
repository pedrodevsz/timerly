import { z } from "zod";

export const sessionIdSchema = z.coerce.number().int().positive("ID de sessão inválido.");
const occurredAtSchema = z.iso.datetime({ offset: true }).optional();

export const createStudySessionSchema = z.object({
  topicId: z.number().int().positive(),
  occurredAt: occurredAtSchema,
});
export const updateStudySessionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("pause"), occurredAt: occurredAtSchema }),
  z.object({ action: z.literal("resume"), occurredAt: occurredAtSchema }),
  z.object({ action: z.literal("stop"), occurredAt: occurredAtSchema }),
]);
export type CreateStudySessionInput = z.infer<typeof createStudySessionSchema>;
export type UpdateStudySessionInput = z.infer<typeof updateStudySessionSchema>;
