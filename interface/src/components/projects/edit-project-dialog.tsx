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
import { Input, Textarea } from "@/components/ui/input";
import { createProjectSchema } from "@/modules/projects/project.schema";
import { projectApi } from "@/services/project-service";
import type { ProjectDetailDto } from "@/types/domain";

export function EditProjectDialog({
  open,
  onOpenChange,
  project,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectDetailDto;
  onSaved: (project: ProjectDetailDto) => void;
}) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [errors, setErrors] = useState<{ name?: string; description?: string }>(
    {},
  );
  const [requestError, setRequestError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  function reset() {
    setName(project.name);
    setDescription(project.description);
    setErrors({});
    setRequestError(null);
  }
  function changeOpen(nextOpen: boolean) {
    if (submitting) return;
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setErrors({});
    setRequestError(null);
    const parsed = createProjectSchema.safeParse({ name, description });
    if (!parsed.success) {
      const fields = parsed.error.flatten().fieldErrors;
      setErrors({
        name: fields.name?.[0],
        description: fields.description?.[0],
      });
      return;
    }
    setSubmitting(true);
    try {
      const updated = await projectApi.update(project.id, parsed.data);
      onSaved(updated);
      reset();
      onOpenChange(false);
    } catch (reason) {
      setRequestError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível editar o projeto.",
      );
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar projeto</DialogTitle>
          <DialogDescription>
            Atualize o nome e a descrição do projeto.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="space-y-4">
          <label className="block space-y-2 text-xs font-medium">
            <span>Nome do projeto</span>
            <Input
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (errors.name)
                  setErrors((current) => ({ ...current, name: undefined }));
              }}
              disabled={submitting}
              autoFocus
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name && (
              <span className="block text-[11px] text-[var(--danger)]">
                {errors.name}
              </span>
            )}
          </label>
          <label className="block space-y-2 text-xs font-medium">
            <span>
              Descrição{" "}
              <span className="text-[var(--muted-foreground)]">(opcional)</span>
            </span>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={submitting}
            />
            {errors.description && (
              <span className="block text-[11px] text-[var(--danger)]">
                {errors.description}
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
              {submitting ? "Salvando…" : "Salvar alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
