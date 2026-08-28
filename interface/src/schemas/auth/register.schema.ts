import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, "Informe seu nome."),
    email: z
      .string()
      .trim()
      .min(1, "Informe seu e-mail.")
      .email("Informe um e-mail válido."),
    password: z
      .string()
      .min(8, "A senha precisa ter pelo menos 8 caracteres."),
    passwordConfirmation: z.string().min(1, "Confirme sua senha."),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "As senhas precisam ser iguais.",
    path: ["passwordConfirmation"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
