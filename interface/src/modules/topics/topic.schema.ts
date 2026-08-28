import { z } from "zod";

export const TOPIC_NAME_MAX_LENGTH = 180;
export const MAX_BULK_TOPICS = 100;

const topicNameSchema = z
  .string()
  .trim()
  .min(2, "Informe ao menos 2 caracteres.")
  .max(
    TOPIC_NAME_MAX_LENGTH,
    `Use no máximo ${TOPIC_NAME_MAX_LENGTH} caracteres.`,
  );

export const topicIdSchema = z.coerce
  .number()
  .int()
  .positive("ID de tópico inválido.");
export const createTopicSchema = z.object({
  name: topicNameSchema,
  completed: z.boolean().default(false),
});
export const createBulkTopicsSchema = z.object({
  topics: z
    .array(topicNameSchema)
    .min(1, "Informe ao menos um tópico.")
    .max(
      MAX_BULK_TOPICS,
      `Adicione no máximo ${MAX_BULK_TOPICS} tópicos por vez.`,
    ),
});
export const updateTopicSchema = z
  .object({
    name: z.string().trim().min(2).max(180).optional(),
    completed: z.boolean().optional(),
  })
  .refine(
    (value) => Object.keys(value).length > 0,
    "Informe ao menos um campo.",
  );
export type CreateTopicInput = z.infer<typeof createTopicSchema>;
export type CreateBulkTopicsInput = z.infer<typeof createBulkTopicsSchema>;
export type UpdateTopicInput = z.infer<typeof updateTopicSchema>;
