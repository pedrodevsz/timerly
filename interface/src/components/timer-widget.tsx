"use client";

import {
  AlertCircle,
  ChevronUp,
  LoaderCircle,
  Pause,
  Play,
  RefreshCw,
  Square,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/contexts/timer-context";
import {
  selectElapsedSeconds,
  selectRunningIntent,
  selectTimerContext,
  type TimerStartContext,
  useTimerStore,
} from "@/stores/timer-store";

export function TimerWidget() {
  const context = useTimerStore(selectTimerContext);
  return context ? <ActiveTimerWidget context={context} /> : null;
}

function ActiveTimerWidget({ context }: { context: TimerStartContext }) {
  const elapsed = useTimerStore(selectElapsedSeconds);
  const running = useTimerStore(selectRunningIntent);
  const phase = useTimerStore((state) => state.phase);
  const timerOpen = useTimerStore((state) => state.timerOpen);
  const syncError = useTimerStore((state) => state.syncError);
  const setTimerOpen = useTimerStore((state) => state.setTimerOpen);
  const toggleRunning = useTimerStore((state) => state.toggleRunning);
  const stopSession = useTimerStore((state) => state.stopSession);
  const retryPending = useTimerStore((state) => state.retryPending);
  const transitioning = ["starting", "pausing", "resuming", "finishing"].includes(
    phase,
  );
  const primaryLabel =
    phase === "starting" || phase === "resuming"
      ? "Iniciando…"
      : phase === "pausing"
        ? "Pausando…"
        : running
          ? "Pausar"
          : "Continuar";

  return (
    <>
      <button
        onClick={() => setTimerOpen(true)}
        className="timer-pill group fixed bottom-20 right-4 z-40 flex items-center gap-3 rounded-full border border-[var(--border-strong)] bg-[var(--surface-elevated)] py-2 pl-2 pr-3 shadow-2xl backdrop-blur-xl transition hover:-translate-y-0.5 sm:bottom-6 sm:right-6"
        aria-label="Abrir cronômetro"
      >
        <span className="relative flex size-8 items-center justify-center rounded-full bg-[var(--accent-primary-muted)] text-[var(--accent-primary)]">
          {running && (
            <span className="absolute inset-0 animate-ping rounded-full border border-[var(--accent-primary)] opacity-25" />
          )}
          {running ? (
            <Pause className="size-3.5 fill-current" />
          ) : (
            <Play className="size-3.5 fill-current" />
          )}
        </span>
        <span className="max-w-28 truncate text-left text-xs font-medium text-[var(--muted-foreground)] sm:max-w-40">
          {context.subject.name}
        </span>
        <span className="font-display text-base font-semibold tabular-nums tracking-wide sm:text-lg">
          {formatTime(elapsed)}
        </span>
        <ChevronUp className="size-3.5 text-[var(--muted-foreground)] transition group-hover:-translate-y-0.5" />
      </button>

      <Dialog open={timerOpen} onOpenChange={setTimerOpen}>
        <DialogContent className="max-w-xl overflow-hidden p-0">
          <div className="relative px-5 pb-8 pt-6 sm:px-8 sm:pb-10 sm:pt-8">
            <div className="timer-glow pointer-events-none absolute left-1/2 top-1/3 size-72 -translate-x-1/2 rounded-full" />
            <DialogHeader className="relative">
              <DialogTitle>Sessão em andamento</DialogTitle>
              <DialogDescription>{context.project.name}</DialogDescription>
            </DialogHeader>

            <div className="relative mt-10 text-center sm:mt-12">
              <div
                data-testid="timer-display"
                className="font-display text-[clamp(4rem,20vw,7rem)] font-semibold leading-none tracking-[-.07em] tabular-nums"
              >
                {formatTime(elapsed)}
              </div>
              <p className="mt-4 text-xs uppercase tracking-[.2em] text-[var(--muted-foreground)] sm:mt-5">
                {phase === "starting"
                  ? "iniciando sessão"
                  : phase === "pausing"
                    ? "sincronizando pausa"
                    : phase === "resuming"
                      ? "sincronizando retomada"
                      : phase === "finishing"
                        ? "finalizando sessão"
                        : running
                          ? "foco ativo"
                          : "sessão pausada"}
              </p>
            </div>

            <div className="relative mt-9 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-left">
                <span className="block text-[10px] font-medium uppercase tracking-[.14em] text-[var(--muted-foreground)]">
                  Matéria
                </span>
                <span className="mt-1.5 block truncate text-sm font-medium">
                  {context.subject.name}
                </span>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-left">
                <span className="block text-[10px] font-medium uppercase tracking-[.14em] text-[var(--muted-foreground)]">
                  Tópico
                </span>
                <span className="mt-1.5 block truncate text-sm font-medium">
                  {context.topic.name}
                </span>
              </div>
            </div>

            {phase === "error" && syncError ? (
              <div className="relative mt-5 flex flex-col gap-3 rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-4 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-start gap-2.5 text-sm">
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-[var(--danger)]" />
                  <span>{syncError}</span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => void retryPending()}
                >
                  <RefreshCw className="size-3.5" />
                  Tentar novamente
                </Button>
              </div>
            ) : null}

            <div className="relative mt-10 flex justify-center gap-4 sm:mt-12">
              <Button
                size="icon"
                variant="secondary"
                className="size-14 rounded-full"
                onClick={() => void stopSession()}
                disabled={transitioning || phase === "error"}
                aria-label={
                  phase === "finishing" ? "Finalizando sessão…" : "Encerrar sessão"
                }
              >
                {phase === "finishing" ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Square className="size-4 fill-current" />
                )}
              </Button>
              <Button
                size="icon"
                className="size-16 rounded-full shadow-[0_0_36px_var(--accent-primary-glow)] sm:size-20"
                onClick={() => void toggleRunning()}
                disabled={transitioning || phase === "error"}
                aria-label={primaryLabel}
              >
                {phase === "starting" ||
                phase === "pausing" ||
                phase === "resuming" ? (
                  <LoaderCircle className="size-5 animate-spin" />
                ) : running ? (
                  <Pause className="size-5 fill-current" />
                ) : (
                  <Play className="ml-0.5 size-5 fill-current" />
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
