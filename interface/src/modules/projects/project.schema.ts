import { z } from "zod";

export const projectIdSchema = z.uuid("ID de projeto inválido.");
export const createProjectSchema = z.object({
  name: z.string().trim().min(2, "Informe ao menos 2 caracteres.").max(120),
  description: z.string().trim().max(600).default(""),
});
export const updateProjectSchema = createProjectSchema
  .partial()
  .refine(
    (value) => Object.keys(value).length > 0,
    "Informe ao menos um campo.",
  );
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
