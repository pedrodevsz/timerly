"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, LoaderCircle, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  cleanTopicName,
  normalizeTopicName,
} from "@/lib/topics/parse-bulk-topics";
import { studySessionApi } from "@/services/study-session-service";
import type { ManualStudyOptionsDto } from "@/types/domain";

type TopicChoice =
  | { type: "existing"; id: number; name: string }
  | { type: "new"; name: string };

type Suggestion = TopicChoice & { key: string };

type ManualStudyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function localDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function ManualStudyDialog({
  open,
  onOpenChange,
}: ManualStudyDialogProps) {
  const [subjects, setSubjects] = useState<ManualStudyOptionsDto>([]);
  const [subjectId, setSubjectId] = useState("");
  const [topicQuery, setTopicQuery] = useState("");
  const [topicChoice, setTopicChoice] = useState<TopicChoice | null>(null);
  const [studyDate, setStudyDate] = useState(localDate);
  const [hours, setHours] = useState("0");
  const [minutes, setMinutes] = useState("");
  const [listOpen, setListOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedSubject = subjects.find((subject) => subject.id === subjectId);
  const suggestions = useMemo<Suggestion[]>(() => {
    if (!selectedSubject) return [];
    const normalizedQuery = normalizeTopicName(topicQuery);
    const existing = selectedSubject.topics
      .filter((topic) =>
        normalizedQuery
          ? normalizeTopicName(topic.name).includes(normalizedQuery)
          : true,
      )
      .map((topic) => ({
        type: "existing" as const,
        id: topic.id,
        name: topic.name,
        key: `topic-${topic.id}`,
      }));
    const cleaned = cleanTopicName(topicQuery);
    const hasExactMatch = selectedSubject.topics.some(
      (topic) => normalizeTopicName(topic.name) === normalizeTopicName(cleaned),
    );
    return cleaned.length >= 2 && !hasExactMatch
      ? [...existing, { type: "new", name: cleaned, key: `new-${cleaned}` }]
      : existing;
  }, [selectedSubject, topicQuery]);

  useEffect(() => {
    if (!open) return;
    void studySessionApi
      .manualOptions()
      .then(setSubjects)
      .catch((reason: unknown) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "Não foi possível carregar matérias e tópicos.",
        ),
      )
      .finally(() => setLoading(false));
  }, [open]);

  function reset() {
    setSubjects([]);
    setSubjectId("");
    setTopicQuery("");
    setTopicChoice(null);
    setStudyDate(localDate());
    setHours("0");
    setMinutes("");
    setListOpen(false);
    setActiveIndex(0);
    setLoading(true);
    setError(null);
  }

  function changeOpen(nextOpen: boolean) {
    if (submitting) return;
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  }

  function chooseTopic(suggestion: Suggestion) {
    const choice: TopicChoice =
      suggestion.type === "existing"
        ? { type: "existing", id: suggestion.id, name: suggestion.name }
        : { type: "new", name: suggestion.name };
    setTopicChoice(choice);
    setTopicQuery(choice.name);
    setListOpen(false);
    setError(null);
  }

  function handleTopicKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setListOpen(false);
      return;
    }
    if (!suggestions.length) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setListOpen(true);
      setActiveIndex((current) => {
        const offset = event.key === "ArrowDown" ? 1 : -1;
        return (current + offset + suggestions.length) % suggestions.length;
      });
    }
    if (event.key === "Enter" && listOpen) {
      event.preventDefault();
      chooseTopic(suggestions[activeIndex] ?? suggestions[0]);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const parsedHours = Number(hours || 0);
    const parsedMinutes = Number(minutes || 0);
    const durationSeconds = (parsedHours * 60 + parsedMinutes) * 60;
    if (!subjectId) return setError("Selecione uma matéria.");
    if (!topicChoice)
      return setError(
        "Selecione um tópico ou confirme a criação de um novo.",
      );
    if (!studyDate) return setError("Informe a data do estudo.");
    if (!Number.isInteger(durationSeconds) || durationSeconds <= 0)
      return setError("Informe uma duração maior que zero.");
    if (parsedMinutes < 0 || parsedMinutes > 59 || durationSeconds > 86_400)
      return setError("Informe uma duração de até 24 horas, com minutos entre 0 e 59.");

    setSubmitting(true);
    try {
      const result = await studySessionApi.createManual({
        subjectId,
        topic:
          topicChoice.type === "existing"
            ? { type: "existing", id: topicChoice.id }
            : { type: "new", name: topicChoice.name },
        studyDate,
        durationSeconds,
      });
      window.dispatchEvent(new Event("study-data-updated"));
      toast.success("Estudo adicionado", {
        description: result.topicCreated
          ? "A sessão e o novo tópico foram registrados."
          : "A sessão foi incluída nas suas métricas.",
      });
      reset();
      onOpenChange(false);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível adicionar o estudo.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Adicionar estudo manualmente</DialogTitle>
          <DialogDescription>
            Registre uma sessão já concluída sem interferir no cronômetro ativo.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-5" onSubmit={submit} noValidate>
          <label className="block space-y-2 text-xs font-medium">
            <span>Matéria</span>
            <select
              value={subjectId}
              onChange={(event) => {
                setSubjectId(event.target.value);
                setTopicQuery("");
                setTopicChoice(null);
                setListOpen(false);
                setError(null);
              }}
              className="select-field w-full max-w-none normal-case tracking-normal"
              disabled={loading || submitting}
            >
              <option value="">Selecione uma matéria</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.project.name} — {subject.name}
                </option>
              ))}
            </select>
          </label>

          <div className="space-y-2 text-xs font-medium">
            <label htmlFor="manual-topic">Tópico</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-[var(--muted-foreground)]" />
              <Input
                id="manual-topic"
                value={topicQuery}
                onChange={(event) => {
                  setTopicQuery(event.target.value);
                  setTopicChoice(null);
                  setActiveIndex(0);
                  setListOpen(true);
                  setError(null);
                }}
                onFocus={() => setListOpen(true)}
                onBlur={(event) => {
                  const nextElement = event.relatedTarget as HTMLElement | null;
                  if (!nextElement?.closest("#manual-topic-options")) {
                    setListOpen(false);
                  }
                }}
                onKeyDown={handleTopicKeyDown}
                className="pl-10"
                placeholder={
                  subjectId
                    ? "Busque ou escreva um novo tópico"
                    : "Selecione uma matéria primeiro"
                }
                disabled={!subjectId || loading || submitting}
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={listOpen && suggestions.length > 0}
                aria-controls="manual-topic-options"
                aria-activedescendant={
                  listOpen && suggestions[activeIndex]
                    ? `manual-topic-option-${activeIndex}`
                    : undefined
                }
              />
              {listOpen && subjectId && (
                <div
                  id="manual-topic-options"
                  role="listbox"
                  className="absolute z-20 mt-2 max-h-52 w-full overflow-y-auto rounded-xl border border-[var(--border-strong)] bg-[var(--surface-elevated)] p-1.5 shadow-2xl"
                >
                  {suggestions.length ? (
                    suggestions.map((suggestion, index) => (
                      <button
                        key={suggestion.key}
                        id={`manual-topic-option-${index}`}
                        type="button"
                        role="option"
                        aria-label={
                          suggestion.type === "new"
                            ? `Criar novo tópico: ${suggestion.name}`
                            : suggestion.name
                        }
                        aria-selected={
                          topicChoice?.type === suggestion.type &&
                          topicChoice.name === suggestion.name
                        }
                        className={cn(
                          "flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition",
                          index === activeIndex
                            ? "bg-[var(--surface-3)] text-[var(--foreground)]"
                            : "text-[var(--muted-foreground)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]",
                        )}
                        onMouseDown={(event) => event.preventDefault()}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => chooseTopic(suggestion)}
                      >
                        {suggestion.type === "new" ? (
                          <Plus className="size-4 shrink-0 text-[var(--accent-primary)]" />
                        ) : (
                          <Check className="size-4 shrink-0 opacity-50" />
                        )}
                        <span className="min-w-0 flex-1 truncate">
                          {suggestion.type === "new"
                            ? `Criar “${suggestion.name}”`
                            : suggestion.name}
                        </span>
                        {suggestion.type === "new" && <Badge>novo</Badge>}
                      </button>
                    ))
                  ) : (
                    <p className="px-3 py-4 text-center text-xs text-[var(--muted-foreground)]">
                      Digite ao menos 2 caracteres para criar um novo tópico.
                    </p>
                  )}
                </div>
              )}
            </div>
            {topicChoice && (
              <p className="flex items-center gap-2 text-[11px] text-[var(--muted-foreground)]">
                {topicChoice.type === "new"
                  ? "Novo tópico selecionado"
                  : "Tópico existente selecionado"}
                {topicChoice.type === "new" && <Badge>novo</Badge>}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2 text-xs font-medium">
              <span>Data</span>
              <Input
                type="date"
                value={studyDate}
                max={localDate()}
                onChange={(event) => setStudyDate(event.target.value)}
                disabled={submitting}
              />
            </label>
            <fieldset className="space-y-2">
              <legend className="text-xs font-medium">Duração</legend>
              <div className="grid grid-cols-2 gap-2">
                <label className="relative">
                  <span className="sr-only">Horas</span>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    max="24"
                    aria-label="Horas"
                    value={hours}
                    onChange={(event) => setHours(event.target.value)}
                    className="pr-12"
                    disabled={submitting}
                  />
                  <span className="pointer-events-none absolute right-3 top-3.5 text-xs text-[var(--muted-foreground)]">
                    h
                  </span>
                </label>
                <label className="relative">
                  <span className="sr-only">Minutos</span>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    max="59"
                    aria-label="Minutos"
                    value={minutes}
                    onChange={(event) => setMinutes(event.target.value)}
                    placeholder="30"
                    className="pr-12"
                    disabled={submitting}
                  />
                  <span className="pointer-events-none absolute right-3 top-3.5 text-xs text-[var(--muted-foreground)]">
                    min
                  </span>
                </label>
              </div>
            </fieldset>
          </div>

          {loading && (
            <p className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
              <LoaderCircle className="size-3.5 animate-spin" /> Carregando opções…
            </p>
          )}
          {!loading && subjects.length === 0 && !error && (
            <p className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--muted-foreground)]">
              Crie uma matéria em um projeto antes de registrar um estudo.
            </p>
          )}
          {error && (
            <p
              role="alert"
              className="rounded-lg border border-[color-mix(in_srgb,var(--danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--danger)_8%,transparent)] px-3 py-2 text-xs text-[var(--danger)]"
            >
              {error}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => changeOpen(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || submitting || subjects.length === 0}
            >
              {submitting ? "Salvando…" : "Adicionar estudo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
