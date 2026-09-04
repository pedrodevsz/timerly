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
import { loginSchema, type LoginInput } from "@/schemas/auth/login.schema";
import { authApi } from "@/services/auth-service";

type FieldErrors = Partial<Record<keyof LoginInput, string>>;

export function LoginForm() {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const result = loginSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    if (!result.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof LoginInput;
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
      await authApi.login(result.data);
      await completeAuthentication();
    } catch (reason) {
      setStatus(
        reason instanceof Error
          ? reason.message
          : "Não foi possível entrar. Tente novamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" noValidate onSubmit={handleSubmit}>
      <AuthField id="login-email" label="E-mail" error={errors.email}>
        <Input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="voce@exemplo.com"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "login-email-error" : undefined}
        />
      </AuthField>

      <AuthField id="login-password" label="Senha" error={errors.password}>
        <PasswordInput
          id="login-password"
          name="password"
          autoComplete="current-password"
          placeholder="Sua senha"
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "login-password-error" : undefined}
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
        {isSubmitting ? "Entrando…" : "Entrar"}
      </Button>

      <AuthDivider />
      <GoogleAuthButton
        source="login"
        disabled={isSubmitting}
        onError={setStatus}
      />

      <p className="text-center text-sm text-[var(--muted-foreground)]">
        Não possui uma conta?{" "}
        <Link
          href="/register"
          className="font-medium text-[var(--accent-primary)] outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        >
          Criar conta
        </Link>
      </p>
    </form>
  );
}
