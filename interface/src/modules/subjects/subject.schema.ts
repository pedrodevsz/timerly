import { z } from "zod";

export const subjectIdSchema = z.uuid("ID de matéria inválido.");
export const createSubjectSchema = z.object({ name: z.string().trim().min(2, "Informe ao menos 2 caracteres.").max(120, "Use no máximo 120 caracteres.") });
export const updateSubjectSchema = createSubjectSchema.partial().refine((value) => Object.keys(value).length > 0, "Informe ao menos um campo.");
export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
