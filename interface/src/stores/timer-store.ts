"use client";

import { create } from "zustand";
import { toast } from "sonner";
import { ApiClientError } from "@/services/api-client";
import { studySessionApi } from "@/services/study-session-service";
import type { StudySessionDto } from "@/types/domain";

export type TimerPhase =
  | "idle"
  | "starting"
  | "running"
  | "pausing"
  | "paused"
  | "resuming"
  | "finishing"
  | "error";

export type TimerStartContext = Pick<
  StudySessionDto,
  "project" | "subject" | "topic"
>;

type PendingAction = {
  type: "start" | "pause" | "resume" | "stop";
  occurredAt: string;
  attempts: number;
  startContext?: TimerStartContext;
};

type TimerStore = {
  session: StudySessionDto | null;
  optimisticContext: TimerStartContext | null;
  phase: TimerPhase;
  baseElapsedSeconds: number;
  anchorTimestamp: number | null;
  clockTimestamp: number;
  timerOpen: boolean;
  pendingAction: PendingAction | null;
  syncError: string | null;
  lastConfirmedAt: string | null;
  hydrate: (session: StudySessionDto | null) => void;
  tick: (timestamp: number) => void;
  setTimerOpen: (open: boolean) => void;
  startSession: (context: TimerStartContext) => Promise<void>;
  toggleRunning: () => Promise<void>;
  stopSession: () => Promise<void>;
  retryPending: () => Promise<void>;
};

const retryDelays = [0, 300, 900] as const;

function isCounting(state: TimerStore) {
  return (
    state.phase === "starting" ||
    state.phase === "running" ||
    state.phase === "resuming" ||
    (state.phase === "error" && state.pendingAction?.type === "resume")
  );
}

export function selectElapsedSeconds(state: TimerStore) {
  if (!isCounting(state) || state.anchorTimestamp === null) {
    return state.baseElapsedSeconds;
  }
  return (
    state.baseElapsedSeconds +
    Math.max(
      0,
      Math.floor((state.clockTimestamp - state.anchorTimestamp) / 1000),
    )
  );
}

export function selectTimerContext(state: TimerStore) {
  return state.session ?? state.optimisticContext;
}

export function selectRunningIntent(state: TimerStore) {
  return isCounting(state);
}

function transitionalPhase(action: PendingAction["type"]): TimerPhase {
  if (action === "start") return "starting";
  if (action === "pause") return "pausing";
  if (action === "resume") return "resuming";
  return "finishing";
}

function shouldRetry(reason: unknown) {
  return !(reason instanceof ApiClientError) || reason.status >= 500 || reason.status === 429;
}

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));
}

export const useTimerStore = create<TimerStore>()((set, get) => {
  async function request(pending: PendingAction) {
    if (pending.type === "start" && pending.startContext) {
      return studySessionApi.start(
        pending.startContext.topic.id,
        pending.occurredAt,
      );
    }
    const sessionId = get().session?.id;
    if (!sessionId || pending.type === "start") {
      throw new Error("A sessão ainda não possui um identificador válido.");
    }
    return studySessionApi.action(sessionId, pending.type, pending.occurredAt);
  }

  function confirm(pending: PendingAction, session: StudySessionDto) {
    const confirmedAt = Date.now();
    if (pending.type === "stop") {
      set({
        session: null,
        optimisticContext: null,
        phase: "idle",
        baseElapsedSeconds: 0,
        anchorTimestamp: null,
        clockTimestamp: confirmedAt,
        timerOpen: false,
        pendingAction: null,
        syncError: null,
        lastConfirmedAt: new Date(confirmedAt).toISOString(),
      });
      window.dispatchEvent(new Event("study-data-updated"));
      return;
    }

    const running = session.status === "ACTIVE";
    set({
      session,
      optimisticContext: null,
      phase: running ? "running" : "paused",
      baseElapsedSeconds: session.elapsedSeconds,
      anchorTimestamp: running ? confirmedAt : null,
      clockTimestamp: confirmedAt,
      pendingAction: null,
      syncError: null,
      lastConfirmedAt: new Date(confirmedAt).toISOString(),
    });
  }

  async function synchronize(pending: PendingAction) {
    let lastError: unknown;
    for (let index = 0; index < retryDelays.length; index++) {
      if (retryDelays[index]) await wait(retryDelays[index]);
      const current = get().pendingAction;
      if (!current || current.occurredAt !== pending.occurredAt) return;
      set({ pendingAction: { ...current, attempts: index + 1 } });
      try {
        confirm(pending, await request(pending));
        return;
      } catch (reason) {
        lastError = reason;
        if (!shouldRetry(reason)) break;
      }
    }

    const message =
      lastError instanceof Error
        ? lastError.message
        : "Não foi possível sincronizar o cronômetro.";
    set({ phase: "error", syncError: message });
    toast.error(message);
  }

  function begin(pending: PendingAction, optimistic: Partial<TimerStore>) {
    set({
      ...optimistic,
      phase: transitionalPhase(pending.type),
      pendingAction: pending,
      syncError: null,
    });
    return synchronize(pending);
  }

  return {
    session: null,
    optimisticContext: null,
    phase: "idle",
    baseElapsedSeconds: 0,
    anchorTimestamp: null,
    clockTimestamp: Date.now(),
    timerOpen: false,
    pendingAction: null,
    syncError: null,
    lastConfirmedAt: null,

    hydrate(session) {
      const timestamp = Date.now();
      set({
        session,
        optimisticContext: null,
        phase: session
          ? session.status === "ACTIVE"
            ? "running"
            : "paused"
          : "idle",
        baseElapsedSeconds: session?.elapsedSeconds ?? 0,
        anchorTimestamp: session?.status === "ACTIVE" ? timestamp : null,
        clockTimestamp: timestamp,
        pendingAction: null,
        syncError: null,
        lastConfirmedAt: session ? new Date(timestamp).toISOString() : null,
      });
    },

    tick(timestamp) {
      set({ clockTimestamp: timestamp });
    },

    setTimerOpen(timerOpen) {
      set({ timerOpen });
    },

    async startSession(context) {
      const current = get();
      const currentContext = selectTimerContext(current);
      if (current.phase !== "idle") {
        set({ timerOpen: true });
        if (currentContext?.topic.id !== context.topic.id) {
          toast.error("Encerre a sessão atual antes de estudar outro tópico.");
        }
        return;
      }

      const timestamp = Date.now();
      const pending: PendingAction = {
        type: "start",
        occurredAt: new Date(timestamp).toISOString(),
        attempts: 0,
        startContext: context,
      };
      await begin(pending, {
        optimisticContext: context,
        baseElapsedSeconds: 0,
        anchorTimestamp: timestamp,
        clockTimestamp: timestamp,
        timerOpen: true,
      });
    },

    async toggleRunning() {
      const current = get();
      if (!current.session || !["running", "paused"].includes(current.phase)) {
        return;
      }

      const timestamp = Date.now();
      const elapsed = selectElapsedSeconds({
        ...current,
        clockTimestamp: timestamp,
      });
      const type = current.phase === "running" ? "pause" : "resume";
      const pending: PendingAction = {
        type,
        occurredAt: new Date(timestamp).toISOString(),
        attempts: 0,
      };
      await begin(pending, {
        baseElapsedSeconds: elapsed,
        anchorTimestamp: type === "resume" ? timestamp : null,
        clockTimestamp: timestamp,
      });
    },

    async stopSession() {
      const current = get();
      if (!current.session || !["running", "paused"].includes(current.phase)) {
        return;
      }

      const timestamp = Date.now();
      const pending: PendingAction = {
        type: "stop",
        occurredAt: new Date(timestamp).toISOString(),
        attempts: 0,
      };
      await begin(pending, {
        baseElapsedSeconds: selectElapsedSeconds({
          ...current,
          clockTimestamp: timestamp,
        }),
        anchorTimestamp: null,
        clockTimestamp: timestamp,
      });
    },

    async retryPending() {
      const pending = get().pendingAction;
      if (!pending || get().phase !== "error") return;
      set({
        phase: transitionalPhase(pending.type),
        pendingAction: { ...pending, attempts: 0 },
        syncError: null,
      });
      await synchronize({ ...pending, attempts: 0 });
    },
  };
});
