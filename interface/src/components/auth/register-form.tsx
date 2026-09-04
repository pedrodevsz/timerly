"use client";

import { useState } from "react";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { AuthDivider } from "@/components/auth/auth-divider";
import { completeAuthentication } from "@/components/auth/complete-authentication";
import { AuthField } from "@/components/auth/auth-field";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  registerSchema,
  type RegisterInput,
} from "@/schemas/auth/register.schema";
import { authApi } from "@/services/auth-service";

type FieldErrors = Partial<Record<keyof RegisterInput, string>>;

export function RegisterForm() {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const result = registerSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      passwordConfirmation: formData.get("passwordConfirmation"),
    });

    if (!result.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof RegisterInput;
        nextErrors[field] ??= issue.message;
      }
      setErrors(nextErrors);
      setStatus("");
      return;
    }

    setErrors({});
    setStatus("");
    setIsSubmitting(true);

    try {
      await authApi.register({
        name: result.data.name,
        email: result.data.email,
        password: result.data.password,
      });
      await completeAuthentication();
    } catch (reason) {
      setStatus(
        reason instanceof Error
          ? reason.message
          : "Não foi possível criar a conta. Tente novamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" noValidate onSubmit={handleSubmit}>
      <AuthField id="register-name" label="Nome" error={errors.name}>
        <Input
          id="register-name"
          name="name"
          autoComplete="name"
          placeholder="Seu nome"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "register-name-error" : undefined}
        />
      </AuthField>

      <AuthField id="register-email" label="E-mail" error={errors.email}>
        <Input
          id="register-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="voce@exemplo.com"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "register-email-error" : undefined}
        />
      </AuthField>

      <AuthField id="register-password" label="Senha" error={errors.password}>
        <PasswordInput
          id="register-password"
          name="password"
          autoComplete="new-password"
          placeholder="Crie uma senha"
          aria-invalid={Boolean(errors.password)}
          aria-describedby={
            errors.password ? "register-password-error" : undefined
          }
        />
      </AuthField>

      <AuthField
        id="register-password-confirmation"
        label="Confirmar senha"
        error={errors.passwordConfirmation}
      >
        <PasswordInput
          id="register-password-confirmation"
          name="passwordConfirmation"
          autoComplete="new-password"
          placeholder="Repita sua senha"
          aria-invalid={Boolean(errors.passwordConfirmation)}
          aria-describedby={
            errors.passwordConfirmation
              ? "register-password-confirmation-error"
              : undefined
          }
        />
      </AuthField>

      {status ? (
        <p
          role="status"
          className="rounded-lg border border-[var(--accent-primary-border)] bg-[var(--accent-primary-muted)] px-3.5 py-3 text-sm leading-5"
        >
          {status}
        </p>
      ) : null}

      <Button type="submit" className="h-11 w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : null}
        {isSubmitting ? "Criando conta…" : "Criar conta"}
      </Button>

      <AuthDivider />
      <GoogleAuthButton
        source="register"
        disabled={isSubmitting}
        onError={setStatus}
      />

      <p className="text-center text-sm text-[var(--muted-foreground)]">
        Já possui uma conta?{" "}
        <Link
          href="/login"
          className="font-medium text-[var(--accent-primary)] outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        >
          Entrar
        </Link>
      </p>
    </form>
  );
}
