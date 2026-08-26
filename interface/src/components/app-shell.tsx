"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  BookOpen,
  ChevronRight,
  Flame,
  Settings,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TimerWidget } from "@/components/timer-widget";
import { Toaster } from "@/components/ui/sonner";
import { dashboardApi } from "@/services/dashboard-service";
import { settingsApi } from "@/services/settings-service";

const navigation = [
  { href: "/", label: "Visão geral", icon: BarChart3 },
  { href: "/projetos", label: "Projetos", icon: BookOpen },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [streak, setStreak] = useState(0);
  const [profile, setProfile] = useState({ name: "Usuário", email: "" });
  useEffect(() => {
    const load = () => {
      void dashboardApi
        .get()
        .then((data) => setStreak(data.currentStreak))
        .catch(() => undefined);
      void settingsApi
        .get()
        .then((data) => setProfile({ name: data.name, email: data.email }))
        .catch(() => undefined);
    };
    load();
    window.addEventListener("study-data-updated", load);
    window.addEventListener("settings-updated", load);
    return () => {
      window.removeEventListener("study-data-updated", load);
      window.removeEventListener("settings-updated", load);
    };
  }, [pathname]);
  const initials = profile.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="min-h-screen">
      <div className="aurora-canvas" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </div>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-[var(--border)] bg-[var(--sidebar)] px-4 py-5 backdrop-blur-2xl md:flex">
        <Link href="/" className="flex items-center gap-3 px-2 py-1">
          <span className="grid size-9 place-items-center rounded-[10px] bg-[var(--accent-primary)] text-[var(--accent-foreground)] shadow-[0_0_30px_var(--accent-primary-glow)]">
            <Sparkles className="size-4" />
          </span>
          <div>
            <p className="font-display text-lg font-semibold leading-none tracking-tight">
              Orbe
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-[.19em] text-[var(--muted-foreground)]">
              study tracker
            </p>
          </div>
        </Link>
        <nav className="mt-12 space-y-1">
          {navigation.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex h-11 items-center gap-3 rounded-lg px-3 text-sm transition",
                  active
                    ? "bg-[var(--surface-2)] text-[var(--foreground)]"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]",
                )}
              >
                <item.icon
                  className={cn(
                    "size-4",
                    active && "text-[var(--accent-primary)]",
                  )}
                />
                <span>{item.label}</span>
                {active && (
                  <ChevronRight className="ml-auto size-3.5 text-[var(--muted-foreground)]" />
                )}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
            <Flame className="size-3.5 text-[var(--warm)]" /> Sequência atual
          </div>
          <div className="mt-2 font-display text-3xl font-semibold tracking-tight">
            {streak}{" "}
            <span className="font-sans text-xs font-normal text-[var(--muted-foreground)]">
              dias
            </span>
          </div>
          <div className="mt-3 flex gap-1">
            {Array.from({ length: 7 }, (_, index) => (
              <span
                key={index}
                className={cn(
                  "h-1 flex-1 rounded-full",
                  index < Math.min(streak, 7)
                    ? "bg-[var(--warm)]"
                    : "bg-[var(--surface-3)]",
                )}
              />
            ))}
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="grid size-9 place-items-center rounded-full bg-[var(--avatar)] text-xs font-semibold">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{profile.name}</p>
            <p className="truncate text-xs text-[var(--muted-foreground)]">
              {profile.email}
            </p>
          </div>
        </div>
      </aside>
      <main className="relative z-10 min-h-screen pb-28 md:ml-64 md:pb-12">
        {children}
      </main>
      <nav className="fixed inset-x-3 bottom-3 z-30 flex h-16 items-center justify-around rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-elevated)] px-2 shadow-2xl backdrop-blur-xl md:hidden">
        {navigation.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-20 flex-col items-center gap-1 rounded-xl py-2 text-[10px] transition",
                active
                  ? "text-[var(--foreground)]"
                  : "text-[var(--muted-foreground)]",
              )}
            >
              <item.icon
                className={cn(
                  "size-4",
                  active && "text-[var(--accent-primary)]",
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <TimerWidget />
      <Toaster />
    </div>
  );
}
