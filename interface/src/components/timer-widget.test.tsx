import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TimerWidget } from "./timer-widget";

const mocks = vi.hoisted(() => ({
  state: {} as Record<string, unknown>,
  setTimerOpen: vi.fn(),
  toggleRunning: vi.fn(),
  stopSession: vi.fn(),
  retryPending: vi.fn(),
}));

vi.mock("@/stores/timer-store", () => ({
  useTimerStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector(mocks.state),
  selectTimerContext: (state: Record<string, unknown>) =>
    state.session ?? state.optimisticContext,
  selectElapsedSeconds: (state: Record<string, unknown>) =>
    state.baseElapsedSeconds,
  selectRunningIntent: (state: Record<string, unknown>) =>
    ["starting", "running", "resuming"].includes(String(state.phase)),
}));

const session = {
  id: 41,
  status: "ACTIVE" as const,
  startedAt: "2026-09-02T10:00:00.000Z",
  endedAt: null,
  durationSeconds: 0,
  elapsedSeconds: 3723,
  project: { id: "project-a", name: "ENEM 2027" },
  subject: { id: "subject-a", name: "Matemática" },
  topic: { id: 17, name: "Funções quadráticas" },
};

describe("cronômetro vinculado a tópico", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.state = {
      session,
      optimisticContext: null,
      baseElapsedSeconds: 3723,
      phase: "running",
      timerOpen: true,
      syncError: null,
      setTimerOpen: mocks.setTimerOpen,
      toggleRunning: mocks.toggleRunning,
      stopSession: mocks.stopSession,
      retryPending: mocks.retryPending,
    };
  });

  it("exibe matéria e tópico somente para leitura, sem selects", () => {
    render(<TimerWidget />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getAllByText("Matemática")).toHaveLength(2);
    expect(screen.getByText("Funções quadráticas")).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("destaca o tempo de forma responsiva e mantém os controles", async () => {
    const user = userEvent.setup();
    render(<TimerWidget />);

    const display = screen.getByTestId("timer-display");
    expect(display).toHaveTextContent("01:02:03");
    expect(display).toHaveClass("text-[clamp(4rem,20vw,7rem)]");
    expect(screen.getByRole("dialog")).toHaveClass("max-w-xl");

    await user.click(screen.getByRole("button", { name: "Pausar" }));
    await user.click(screen.getByRole("button", { name: "Encerrar sessão" }));
    expect(mocks.toggleRunning).toHaveBeenCalledOnce();
    expect(mocks.stopSession).toHaveBeenCalledOnce();
  });

  it.each([
    ["pausing", "Pausando…"],
    ["resuming", "Iniciando…"],
  ])("bloqueia interação durante %s", (phase, label) => {
    mocks.state.phase = phase;
    render(<TimerWidget />);

    expect(screen.getByRole("button", { name: label })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Encerrar sessão" })).toBeDisabled();
  });

  it("oferece retry manual após falha de sincronização", async () => {
    mocks.state.phase = "error";
    mocks.state.syncError = "Não foi possível sincronizar a pausa.";
    const user = userEvent.setup();
    render(<TimerWidget />);

    expect(screen.getByText("Não foi possível sincronizar a pausa.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(mocks.retryPending).toHaveBeenCalledOnce();
  });
});
