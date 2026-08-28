import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Criar conta | Orbe",
};

export default function RegisterPage() {
  return (
    <AuthCard
      title="Criar conta"
      description="Prepare seu espaço para organizar matérias, tópicos e sessões."
    >
      <RegisterForm />
    </AuthCard>
  );
}
