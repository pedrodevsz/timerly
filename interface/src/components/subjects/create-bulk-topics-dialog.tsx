"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, LoaderCircle } from "lucide-react";
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
import { Textarea } from "@/components/ui/input";
import {
  normalizeTopicName,
  parseBulkTopics,
  type ParsedBulkTopics,
} from "@/lib/topics/parse-bulk-topics";
import {
  createBulkTopicsSchema,
  MAX_BULK_TOPICS,
} from "@/modules/topics/topic.schema";
import { projectApi } from "@/services/project-service";
import type { SubjectDto, TopicDto } from "@/types/domain";

type CreateBulkTopicsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject: SubjectDto;
  onCreated: (topics: TopicDto[]) => void;
};

export function CreateBulkTopicsDialog({
  open,
  onOpenChange,
  subject,
  onCreated,
}: CreateBulkTopicsDialogProps) {
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<ParsedBulkTopics | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const existingNames = useMemo(
    () => new Set(subject.topics.map((topic) => normalizeTopicName(topic.name))),
    [subject.topics],
  );
  const existingCount =
    preview?.topics.filter((topic) =>
      existingNames.has(normalizeTopicName(topic)),
    ).length ?? 0;
  const readyCount = (preview?.topics.length ?? 0) - existingCount;

  function reset() {
    setText("");
    setPreview(null);
    setFieldError(null);
    setRequestError(null);
  }

  function changeOpen(nextOpen: boolean) {
    if (submitting) return;
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  }

  function reviewTopics() {
    const parsed = parseBulkTopics(text);
    const validation = createBulkTopicsSchema.safeParse({
      topics: parsed.topics,
    });

    setRequestError(null);
    if (!validation.success) {
      setFieldError(
        validation.error.issues[0]?.message ??
          "Não foi possível processar os tópicos.",
      );
      return;
    }

    setFieldError(null);
    setPreview(parsed);
  }

  async function createTopics() {
    if (!preview || submitting || readyCount === 0) return;

    setRequestError(null);
    setSubmitting(true);
    try {
      const result = await projectApi.createTopicsBulk(
        subject.id,
        preview.topics,
      );
      onCreated(result.created);

      const createdLabel = `${result.created.length} ${
        result.created.length === 1 ? "tópico adicionado" : "tópicos adicionados"
      }`;
      const skippedLabel = result.skipped.length
        ? `; ${result.skipped.length} já ${
            result.skipped.length === 1 ? "existia" : "existiam"
          }`
        : "";
      toast.success(`${createdLabel}${skippedLabel}.`);

      reset();
      onOpenChange(false);
    } catch (reason) {
      setRequestError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível adicionar os tópicos.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent className="flex max-h-[calc(100vh-2rem)] max-w-xl flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>Adicionar vários tópicos</DialogTitle>
          <DialogDescription>
            Inclua tópicos em{" "}
            <span className="font-medium text-[var(--foreground)]">
              {subject.name}
            </span>
            . Uma linha será convertida em um tópico.
          </DialogDescription>
        </DialogHeader>

        {preview ? (
          <div className="min-h-0 flex-1 space-y-4 overflow-hidden">
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge>
                {preview.lineCount}{" "}
                {preview.lineCount === 1
                  ? "linha encontrada"
                  : "linhas encontradas"}
              </Badge>
              <Badge>
                {readyCount}{" "}
                {readyCount === 1
                  ? "pronto para adicionar"
                  : "prontos para adicionar"}
              </Badge>
              {preview.duplicateCount > 0 ? (
                <Badge>
                  {preview.duplicateCount}{" "}
                  {preview.duplicateCount === 1
                    ? "duplicado ignorado"
                    : "duplicados ignorados"}
                </Badge>
              ) : null}
              {existingCount > 0 ? (
                <Badge>
                  {existingCount}{" "}
                  {existingCount === 1 ? "já existente" : "já existentes"}
                </Badge>
              ) : null}
            </div>

            <div className="max-h-[min(22rem,45vh)] overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface-2)]">
              <ol className="divide-y divide-[var(--border)]">
                {preview.topics.map((topic, index) => {
                  const alreadyExists = existingNames.has(
                    normalizeTopicName(topic),
                  );

                  return (
                    <li
                      key={`${normalizeTopicName(topic)}-${index}`}
                      className="flex items-center gap-3 px-4 py-3 text-sm"
                    >
                      <span className="w-6 shrink-0 text-right text-xs tabular-nums text-[var(--muted-foreground)]">
                        {index + 1}.
                      </span>
                      <span className="min-w-0 flex-1 break-words">{topic}</span>
                      {alreadyExists ? (
                        <Badge className="shrink-0">Já existe</Badge>
                      ) : (
                        <CheckCircle2
                          className="size-4 shrink-0 text-[var(--positive)]"
                          aria-label="Pronto para adicionar"
                        />
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        ) : (
          <div className="min-h-0 flex-1 space-y-2">
            <label htmlFor="bulk-topics" className="text-xs font-medium">
              Cole os tópicos abaixo, um por linha.
            </label>
            <Textarea
              id="bulk-topics"
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                if (fieldError) setFieldError(null);
              }}
              className="min-h-56 resize-y"
              placeholder={"Modelo relacional\nNormalização\nSQL\nJOIN\nSubqueries"}
              aria-invalid={Boolean(fieldError)}
              aria-describedby={fieldError ? "bulk-topics-error" : undefined}
              autoFocus
            />
            <p className="text-[11px] text-[var(--muted-foreground)]">
              Até {MAX_BULK_TOPICS} tópicos por operação.
            </p>
            {fieldError ? (
              <p
                id="bulk-topics-error"
                role="alert"
                className="text-xs text-[var(--danger)]"
              >
                {fieldError}
              </p>
            ) : null}
          </div>
        )}

        {requestError ? (
          <p
            role="alert"
            className="shrink-0 rounded-lg border border-[color-mix(in_srgb,var(--danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--danger)_8%,transparent)] px-3 py-2 text-xs text-[var(--danger)]"
          >
            {requestError}
          </p>
        ) : null}

        <DialogFooter className="shrink-0">
          {preview ? (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setPreview(null);
                  setRequestError(null);
                }}
                disabled={submitting}
              >
                Voltar
              </Button>
              <Button
                type="button"
                onClick={() => void createTopics()}
                disabled={submitting || readyCount === 0}
              >
                {submitting ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    Adicionando…
                  </>
                ) : (
                  `Adicionar ${readyCount} ${
                    readyCount === 1 ? "tópico" : "tópicos"
                  }`
                )}
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={() => changeOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="button" onClick={reviewTopics}>
                Revisar tópicos
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
