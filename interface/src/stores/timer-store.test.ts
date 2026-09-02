import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { studySessionApi } from "@/services/study-session-service";
import {
  selectElapsedSeconds,
  useTimerStore,
  type TimerStartContext,
} from "./timer-store";

const mocks = vi.hoisted(() => ({ toastError: vi.fn() }));

vi.mock("sonner", () => ({ toast: { error: mocks.toastError } }));

const context: TimerStartContext = {
  project: { id: "project-a", name: "ENEM 2027" },
  subject: { id: "subject-a", name: "Matemática" },
  topic: { id: 17, name: "Funções quadráticas" },
};

const runningSession = {
  id: 41,
  status: "ACTIVE" as const,
  startedAt: "2026-09-02T10:00:00.000Z",
  endedAt: null,
  durationSeconds: 10,
  elapsedSeconds: 10,
  ...context,
};

const pausedSession = {
  ...runningSession,
  status: "PAUSED" as const,
  durationSeconds: 12,
  elapsedSeconds: 12,
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function resetStore() {
  useTimerStore.setState({
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
  });
}

describe("store otimista do cronômetro", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-02T10:00:10.000Z"));
    vi.restoreAllMocks();
    mocks.toastError.mockReset();
    resetStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("inicia visualmente no tópico antes da resposta da API", async () => {
    const request = deferred<typeof runningSession>();
    const start = vi.spyOn(studySessionApi, "start").mockReturnValue(request.promise);

    const operation = useTimerStore.getState().startSession(context);

    expect(useTimerStore.getState()).toMatchObject({
      phase: "starting",
      optimisticContext: context,
      timerOpen: true,
    });
    expect(start).toHaveBeenCalledWith(17, "2026-09-02T10:00:10.000Z");
    request.resolve(runningSession);
    await operation;
    expect(useTimerStore.getState().phase).toBe("running");
  });

  it("pausa imediatamente e não contabiliza o atraso da API", async () => {
    useTimerStore.getState().hydrate(runningSession);
    vi.setSystemTime(new Date("2026-09-02T10:00:12.000Z"));
    useTimerStore.getState().tick(Date.now());
    const request = deferred<typeof pausedSession>();
    const action = vi.spyOn(studySessionApi, "action").mockReturnValue(request.promise);

    const operation = useTimerStore.getState().toggleRunning();

    expect(useTimerStore.getState().phase).toBe("pausing");
    expect(selectElapsedSeconds(useTimerStore.getState())).toBe(12);
    expect(action).toHaveBeenCalledWith(
      41,
      "pause",
      "2026-09-02T10:00:12.000Z",
    );
    vi.setSystemTime(new Date("2026-09-02T10:00:16.000Z"));
    useTimerStore.getState().tick(Date.now());
    expect(selectElapsedSeconds(useTimerStore.getState())).toBe(12);

    request.resolve(pausedSession);
    await operation;
    expect(useTimerStore.getState().phase).toBe("paused");
  });

  it("retoma imediatamente e bloqueia ações concorrentes", async () => {
    useTimerStore.getState().hydrate(pausedSession);
    const request = deferred<typeof runningSession>();
    const action = vi.spyOn(studySessionApi, "action").mockReturnValue(request.promise);

    const operation = useTimerStore.getState().toggleRunning();
    void useTimerStore.getState().toggleRunning();
    vi.setSystemTime(new Date("2026-09-02T10:00:13.000Z"));
    useTimerStore.getState().tick(Date.now());

    expect(useTimerStore.getState().phase).toBe("resuming");
    expect(selectElapsedSeconds(useTimerStore.getState())).toBe(15);
    expect(action).toHaveBeenCalledOnce();
    request.resolve({ ...runningSession, elapsedSeconds: 15 });
    await operation;
    expect(useTimerStore.getState().phase).toBe("running");
  });

  it("sincroniza após retry automático sem duplicar timestamps", async () => {
    useTimerStore.getState().hydrate(runningSession);
    const action = vi
      .spyOn(studySessionApi, "action")
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(pausedSession);

    const operation = useTimerStore.getState().toggleRunning();
    await vi.advanceTimersByTimeAsync(300);
    await operation;

    expect(action).toHaveBeenCalledTimes(2);
    expect(action.mock.calls[0]?.[2]).toBe(action.mock.calls[1]?.[2]);
    expect(useTimerStore.getState().phase).toBe("paused");
  });

  it("mantém a intenção local e permite retry manual após falha definitiva", async () => {
    useTimerStore.getState().hydrate(runningSession);
    const action = vi
      .spyOn(studySessionApi, "action")
      .mockRejectedValue(new Error("Sem conexão"));

    const operation = useTimerStore.getState().toggleRunning();
    await vi.advanceTimersByTimeAsync(1200);
    await operation;

    expect(action).toHaveBeenCalledTimes(3);
    expect(useTimerStore.getState().phase).toBe("error");
    expect(selectElapsedSeconds(useTimerStore.getState())).toBe(10);

    action.mockResolvedValueOnce(pausedSession);
    await useTimerStore.getState().retryPending();
    expect(action).toHaveBeenCalledTimes(4);
    expect(new Set(action.mock.calls.map((call) => call[2])).size).toBe(1);
    expect(useTimerStore.getState().phase).toBe("paused");
  });

  it("finaliza uma única vez e limpa a sessão confirmada", async () => {
    useTimerStore.getState().hydrate(runningSession);
    const action = vi.spyOn(studySessionApi, "action").mockResolvedValue({
      ...pausedSession,
      status: "COMPLETED",
      endedAt: "2026-09-02T10:00:10.000Z",
    });

    const operation = useTimerStore.getState().stopSession();
    void useTimerStore.getState().stopSession();
    await operation;

    expect(action).toHaveBeenCalledOnce();
    expect(action).toHaveBeenCalledWith(
      41,
      "stop",
      "2026-09-02T10:00:10.000Z",
    );
    expect(useTimerStore.getState()).toMatchObject({
      session: null,
      phase: "idle",
      timerOpen: false,
    });
  });
});
