import { z } from "zod";
import { topicNameSchema } from "@/modules/topics/topic.schema";

export const sessionIdSchema = z.coerce.number().int().positive("ID de sessão inválido.");
const occurredAtSchema = z.iso.datetime({ offset: true }).optional();

export const createStudySessionSchema = z.object({
  topicId: z.number().int().positive(),
  occurredAt: occurredAtSchema,
});

const studyDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida.")
  .refine((value) => {
    const date = new Date(`${value}T12:00:00.000Z`);
    return (
      !Number.isNaN(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
    );
  }, "Informe uma data válida.");

export const createManualStudySessionSchema = z.object({
  subjectId: z.uuid("Matéria inválida."),
  topic: z.discriminatedUnion("type", [
    z.object({ type: z.literal("existing"), id: z.number().int().positive() }),
    z.object({ type: z.literal("new"), name: topicNameSchema }),
  ]),
  studyDate: studyDateSchema,
  durationSeconds: z
    .number()
    .int()
    .positive("Informe uma duração maior que zero.")
    .max(86_400, "A duração máxima é de 24 horas."),
});
export const updateStudySessionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("pause"), occurredAt: occurredAtSchema }),
  z.object({ action: z.literal("resume"), occurredAt: occurredAtSchema }),
  z.object({ action: z.literal("stop"), occurredAt: occurredAtSchema }),
]);
export type CreateStudySessionInput = z.infer<typeof createStudySessionSchema>;
export type CreateManualStudySessionInput = z.infer<
  typeof createManualStudySessionSchema
>;
export type UpdateStudySessionInput = z.infer<typeof updateStudySessionSchema>;
