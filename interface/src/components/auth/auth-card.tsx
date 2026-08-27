import type { ReactNode } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type AuthCardProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthCard({ title, description, children }: AuthCardProps) {
  return (
    <Card className="w-full max-w-md overflow-hidden border-[var(--border-strong)] bg-[var(--surface-elevated)] shadow-[0_28px_90px_rgba(0,0,0,.38)] backdrop-blur-xl">
      <CardHeader className="block px-6 pb-4 pt-7 sm:px-8 sm:pt-8">
        <p className="eyebrow mb-3">Sua rotina, em órbita</p>
        <h1 className="font-display text-3xl font-semibold tracking-[-.055em]">
          {title}
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
          {description}
        </p>
      </CardHeader>
      <CardContent className="px-6 pb-7 sm:px-8 sm:pb-8">
        {children}
      </CardContent>
    </Card>
  );
}
