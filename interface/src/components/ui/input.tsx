import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3.5 text-sm outline-none placeholder:text-[var(--muted-foreground)] focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--accent-primary)_20%,transparent)]",
        className,
      )}
      {...props}
    />
  );
}
export function Textarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-3 text-sm outline-none placeholder:text-[var(--muted-foreground)] focus:border-[var(--accent-primary)]",
        className,
      )}
      {...props}
    />
  );
}
