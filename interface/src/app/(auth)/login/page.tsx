import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Entrar | Orbe",
};

export default function LoginPage() {
  return (
    <AuthCard
      title="Entrar"
      description="Retome seus projetos e mantenha o ritmo dos seus estudos."
    >
      <LoginForm />
    </AuthCard>
  );
}
