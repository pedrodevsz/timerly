import { render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TimerProvider } from "./timer-context";
import { useTimerStore } from "@/stores/timer-store";

const mocks = vi.hoisted(() => ({ active: vi.fn() }));

vi.mock("next/navigation", () => ({ usePathname: () => "/projetos/project-a" }));
vi.mock("@/services/study-session-service", () => ({
  studySessionApi: {
    active: mocks.active,
    start: vi.fn(),
    action: vi.fn(),
  },
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const session = {
  id: 41,
  status: "ACTIVE" as const,
  startedAt: "2026-09-02T10:00:00.000Z",
  endedAt: null,
  durationSeconds: 10,
  elapsedSeconds: 10,
  project: { id: "project-a", name: "ENEM 2027" },
  subject: { id: "subject-a", name: "Matemática" },
  topic: { id: 17, name: "Funções quadráticas" },
};

describe("runtime do cronômetro", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
  });

  afterEach(() => {
    document.title = "";
  });

  it("recupera a sessão ativa do backend após reload", async () => {
    mocks.active.mockResolvedValue(session);

    render(<TimerProvider><span>Aplicação</span></TimerProvider>);

    await waitFor(() => expect(useTimerStore.getState().session).toEqual(session));
    expect(useTimerStore.getState().phase).toBe("running");
    expect(document.title).toBe("Timer — Funções quadráticas");
  });

  it("mantém o título sem ícone durante uma sessão pausada", async () => {
    mocks.active.mockResolvedValue({ ...session, status: "PAUSED" });

    render(<TimerProvider><span>Aplicação</span></TimerProvider>);

    await waitFor(() =>
      expect(document.title).toBe("Timer — Funções quadráticas"),
    );
    expect(window.location.search).toBe("");
  });
});
