"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      theme="dark"
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "!border-[var(--border-strong)] !bg-[var(--surface-elevated)] !text-[var(--foreground)] !shadow-2xl !backdrop-blur-xl",
          description: "!text-[var(--muted-foreground)]",
          error: "!border-[color-mix(in_srgb,var(--danger)_35%,transparent)]",
        },
      }}
    />
  );
}
