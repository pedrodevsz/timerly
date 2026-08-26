"use client";

import { useState } from "react";
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
import { createTopicSchema } from "@/modules/topics/topic.schema";
import { projectApi } from "@/services/project-service";
import type { SubjectDto, TopicDto } from "@/types/domain";

type CreateTopicDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject: SubjectDto;
  onCreated: (topic: TopicDto) => void;
};

export function CreateTopicDialog({
  open,
  onOpenChange,
  subject,
  onCreated,
}: CreateTopicDialogProps) {
  const [name, setName] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  function reset() {
    setName("");
    setFieldError(null);
    setRequestError(null);
  }
  function changeOpen(nextOpen: boolean) {
    if (submitting) return;
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setFieldError(null);
    setRequestError(null);
    const parsed = createTopicSchema.safeParse({ name });
    if (!parsed.success) {
      setFieldError(
        parsed.error.flatten().fieldErrors.name?.[0] ??
          "Informe um nome válido.",
      );
      return;
    }
    setSubmitting(true);
    try {
      const topic = await projectApi.createTopic(subject.id, parsed.data.name);
      onCreated(topic);
      reset();
      onOpenChange(false);
    } catch (reason) {
      setRequestError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível criar o tópico.",
      );
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar tópico</DialogTitle>
          <DialogDescription>
            Inclua um novo tópico em{" "}
            <span className="font-medium text-[var(--foreground)]">
              {subject.name}
            </span>
            .
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="space-y-4">
          <label className="block space-y-2 text-xs font-medium">
            <span>Nome do tópico</span>
            <Input
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (fieldError) setFieldError(null);
              }}
              placeholder="Ex: Funções quadráticas"
              autoFocus
              aria-invalid={Boolean(fieldError)}
              aria-describedby={fieldError ? "topic-name-error" : undefined}
              disabled={submitting}
            />
            {fieldError && (
              <span
                id="topic-name-error"
                className="block text-[11px] text-[var(--danger)]"
              >
                {fieldError}
              </span>
            )}
          </label>
          {requestError && (
            <p
              role="alert"
              className="rounded-lg border border-[color-mix(in_srgb,var(--danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--danger)_8%,transparent)] px-3 py-2 text-xs text-[var(--danger)]"
            >
              {requestError}
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
            <Button type="submit" disabled={submitting}>
              {submitting ? "Criando…" : "Criar tópico"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
