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
import { createSubjectSchema } from "@/modules/subjects/subject.schema";
import { projectApi } from "@/services/project-service";
import type { SubjectDto } from "@/types/domain";

type SubjectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  subject?: SubjectDto;
  onSaved: (subject: SubjectDto, created: boolean) => void;
};

export function SubjectDialog({
  open,
  onOpenChange,
  projectId,
  subject,
  onSaved,
}: SubjectDialogProps) {
  const initialName = subject?.name ?? "";
  const [name, setName] = useState(initialName);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const editing = Boolean(subject);

  function reset() {
    setName(initialName);
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
    const parsed = createSubjectSchema.safeParse({ name });
    if (!parsed.success) {
      setFieldError(
        parsed.error.flatten().fieldErrors.name?.[0] ??
          "Informe um nome válido.",
      );
      return;
    }
    setSubmitting(true);
    try {
      const saved = subject
        ? await projectApi.updateSubject(subject.id, parsed.data.name)
        : await projectApi.createSubject(projectId, parsed.data.name);
      onSaved(saved, !subject);
      reset();
      onOpenChange(false);
    } catch (reason) {
      setRequestError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível salvar a matéria.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing ? "Editar matéria" : "Nova matéria"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Atualize o nome usado para organizar os tópicos desta matéria."
              : "Adicione uma matéria ao projeto. Depois, organize o conteúdo em tópicos."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="space-y-4">
          <label className="block space-y-2 text-xs font-medium">
            <span>Nome da matéria</span>
            <Input
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (fieldError) setFieldError(null);
              }}
              placeholder="Ex: Matemática"
              autoFocus
              aria-invalid={Boolean(fieldError)}
              aria-describedby={fieldError ? "subject-name-error" : undefined}
              disabled={submitting}
            />
            {fieldError && (
              <span
                id="subject-name-error"
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
              {submitting
                ? "Salvando…"
                : editing
                  ? "Salvar alterações"
                  : "Criar matéria"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
