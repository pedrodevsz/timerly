export function AuthDivider() {
  return (
    <div className="flex items-center gap-3" aria-hidden="true">
      <span className="h-px flex-1 bg-[var(--border)]" />
      <span className="text-[11px] uppercase tracking-[.14em] text-[var(--muted-foreground)]">
        ou
      </span>
      <span className="h-px flex-1 bg-[var(--border)]" />
    </div>
  );
}
