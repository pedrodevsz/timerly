"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { studySessionApi } from "@/services/study-session-service";
import {
  selectTimerContext,
  useTimerStore,
} from "@/stores/timer-store";

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = pathname === "/login" || pathname === "/register";
  const hydrate = useTimerStore((state) => state.hydrate);
  const tick = useTimerStore((state) => state.tick);
  const phase = useTimerStore((state) => state.phase);
  const context = useTimerStore(selectTimerContext);

  useEffect(() => {
    if (isAuthRoute) return;
    void studySessionApi
      .active()
      .then(hydrate)
      .catch(() => hydrate(null));
  }, [hydrate, isAuthRoute]);

  useEffect(() => {
    if (phase === "idle") return;
    tick(Date.now());
    const interval = window.setInterval(() => tick(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [phase, tick]);

  useEffect(() => {
    if (!context) {
      if (document.title.startsWith("Timer — ")) {
        document.title = "Orbe — Study Tracker";
      }
      return;
    }
    document.title = `Timer — ${context.topic.name}`;
  }, [context]);

  return children;
}

export function formatTime(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}
