"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { studySessionApi } from "@/services/study-session-service";
import type { StudySessionDto } from "@/types/domain";
import { toast } from "sonner";

type TimerContextValue = {
  session: StudySessionDto | null;
  elapsed: number;
  running: boolean;
  loading: boolean;
  error: string | null;
  startSession: (topicId: number) => Promise<void>;
  updateSession: (topicId: number) => Promise<void>;
  toggleRunning: () => Promise<void>;
  stopSession: () => Promise<void>;
};

const TimerContext = createContext<TimerContextValue | null>(null);

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<StudySessionDto | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const running = session?.status === "ACTIVE";

  useEffect(() => {
    studySessionApi
      .active()
      .then((active) => {
        setSession(active);
        setElapsed(active?.elapsedSeconds ?? 0);
      })
      .catch((reason: unknown) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "Falha ao restaurar o cronômetro.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(
      () => setElapsed((value) => value + 1),
      1000,
    );
    return () => window.clearInterval(interval);
  }, [running]);

  async function run(operation: () => Promise<StudySessionDto>, clear = false) {
    setError(null);
    try {
      const updated = await operation();
      if (clear) {
        setSession(null);
        setElapsed(0);
        window.dispatchEvent(new Event("study-data-updated"));
      } else {
        setSession(updated);
        setElapsed(updated.elapsedSeconds);
      }
    } catch (reason) {
      const message =
        reason instanceof Error
          ? reason.message
          : "Não foi possível atualizar o cronômetro.";
      setError(message);
      toast.error(message);
    }
  }

  const value = useMemo<TimerContextValue>(
    () => ({
      session,
      elapsed,
      running,
      loading,
      error,
      async startSession(topicId) {
        await run(() =>
          session
            ? studySessionApi.changeTopic(session.id, topicId)
            : studySessionApi.start(topicId),
        );
      },
      async updateSession(topicId) {
        if (session)
          await run(() => studySessionApi.changeTopic(session.id, topicId));
      },
      async toggleRunning() {
        if (session)
          await run(() =>
            studySessionApi.action(session.id, running ? "pause" : "resume"),
          );
      },
      async stopSession() {
        if (session)
          await run(() => studySessionApi.action(session.id, "stop"), true);
      },
    }),
    [session, elapsed, running, loading, error],
  );

  return (
    <TimerContext.Provider value={value}>{children}</TimerContext.Provider>
  );
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (!context)
    throw new Error("useTimer deve ser usado dentro de TimerProvider");
  return context;
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
