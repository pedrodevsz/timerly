import { z } from "zod";

export const topicIdSchema = z.coerce.number().int().positive("ID de tópico inválido.");
export const createTopicSchema = z.object({ name: z.string().trim().min(2, "Informe ao menos 2 caracteres.").max(180, "Use no máximo 180 caracteres."), completed: z.boolean().default(false) });
export const updateTopicSchema = z.object({ name: z.string().trim().min(2).max(180).optional(), completed: z.boolean().optional() }).refine((value) => Object.keys(value).length > 0, "Informe ao menos um campo.");
export type CreateTopicInput = z.infer<typeof createTopicSchema>;
export type UpdateTopicInput = z.infer<typeof updateTopicSchema>;
