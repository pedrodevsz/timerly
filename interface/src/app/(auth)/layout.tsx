import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { AUTHENTICATED_APP_PATH } from "@/lib/auth/session-config";
import { getCurrentUser } from "@/modules/auth/session.service";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  if (await getCurrentUser()) {
    redirect(AUTHENTICATED_APP_PATH);
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-10 sm:px-6">
      <div className="aurora-canvas" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </div>

      <div className="relative z-10 flex w-full flex-col items-center gap-7">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          aria-label="Orbe — ir para a visão geral"
        >
          <span className="grid size-10 place-items-center rounded-[11px] bg-[var(--accent-primary)] text-[var(--accent-foreground)] shadow-[0_0_30px_var(--accent-primary-glow)]">
            <Sparkles className="size-4" />
          </span>
          <span>
            <span className="block font-display text-xl font-semibold leading-none tracking-tight">
              Orbe
            </span>
            <span className="mt-1 block text-[10px] uppercase tracking-[.19em] text-[var(--muted-foreground)]">
              controle de estudos
            </span>
          </span>
        </Link>

        {children}
      </div>
    </main>
  );
}
