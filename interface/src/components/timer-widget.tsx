"use client";

import { useEffect, useState } from "react";
import { ChevronUp, Pause, Play, Square } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatTime, useTimer } from "@/contexts/timer-context";
import { projectApi } from "@/services/project-service";
import type { ProjectDetailDto, StudySessionDto } from "@/types/domain";

export function TimerWidget() {
  const { session } = useTimer();
  return session ? <ActiveTimerWidget session={session} /> : null;
}

function ActiveTimerWidget({ session }: { session: StudySessionDto }) {
  const { elapsed, running, updateSession, toggleRunning, stopSession } =
    useTimer();
  const [open, setOpen] = useState(false);
  const [project, setProject] = useState<ProjectDetailDto | null>(null);
  useEffect(() => {
    projectApi
      .get(session.project.id)
      .then(setProject)
      .catch(() => setProject(null));
  }, [session.project.id]);
  const selectedSubject = project?.subjects.find(
    (subject) => subject.id === session.subject.id,
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
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
          {session.subject.name}
        </span>
        <span className="font-display text-sm font-semibold tabular-nums tracking-wide">
          {formatTime(elapsed)}
        </span>
        <ChevronUp className="size-3.5 text-[var(--muted-foreground)] transition group-hover:-translate-y-0.5" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md overflow-hidden p-0">
          <div className="relative px-6 pb-8 pt-6">
            <div className="timer-glow pointer-events-none absolute left-1/2 top-1/3 size-60 -translate-x-1/2 rounded-full" />
            <DialogHeader className="relative">
              <DialogTitle>Sessão em andamento</DialogTitle>
              <DialogDescription>{session.project.name}</DialogDescription>
            </DialogHeader>
            <div className="relative mt-10 text-center">
              <div className="mb-3 flex items-center justify-center gap-2 text-sm text-[var(--muted-foreground)]">
                <span className="size-1.5 rounded-full bg-[var(--accent-primary)]" />
                {session.subject.name} · {session.topic.name}
              </div>
              <div className="font-display text-[clamp(3.1rem,16vw,4.8rem)] font-semibold leading-none tracking-[-.06em] tabular-nums">
                {formatTime(elapsed)}
              </div>
              <p className="mt-3 text-xs uppercase tracking-[.18em] text-[var(--muted-foreground)]">
                {running ? "foco ativo" : "sessão pausada"}
              </p>
            </div>
            <div className="relative mt-8 grid grid-cols-2 gap-3">
              <label className="space-y-1.5 text-left text-[10px] font-medium uppercase tracking-[.12em] text-[var(--muted-foreground)]">
                <span>Matéria</span>
                <select
                  value={session.subject.id}
                  onChange={(event) => {
                    const subject = project?.subjects.find(
                      (item) => item.id === event.target.value,
                    );
                    const topic = subject?.topics[0];
                    if (topic) void updateSession(topic.id);
                  }}
                  className="select-field w-full max-w-none normal-case tracking-normal"
                >
                  {project?.subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5 text-left text-[10px] font-medium uppercase tracking-[.12em] text-[var(--muted-foreground)]">
                <span>Tópico</span>
                <select
                  value={session.topic.id}
                  onChange={(event) =>
                    void updateSession(Number(event.target.value))
                  }
                  className="select-field w-full max-w-none normal-case tracking-normal"
                >
                  {selectedSubject?.topics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="relative mt-10 flex justify-center gap-3">
              <Button
                size="icon"
                variant="secondary"
                className="size-12 rounded-full"
                onClick={() => void stopSession()}
                aria-label="Encerrar sessão"
              >
                <Square className="size-4 fill-current" />
              </Button>
              <Button
                size="icon"
                className="size-16 rounded-full shadow-[0_0_32px_var(--accent-primary-glow)]"
                onClick={() => void toggleRunning()}
                aria-label={running ? "Pausar" : "Continuar"}
              >
                {running ? (
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
