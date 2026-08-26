"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowUpRight,
  BookOpen,
  Clock3,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input, Textarea } from "@/components/ui/input";
import { useResource } from "@/hooks/use-resource";
import { projectApi } from "@/services/project-service";
import type { ProjectSummaryDto } from "@/types/domain";

const accents = [
  "var(--accent-primary)",
  "var(--accent-secondary)",
  "var(--accent-tertiary)",
];
function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes.toString().padStart(2, "0")}min`;
}

export function ProjectsView() {
  const loader = useCallback(() => projectApi.list(), []);
  const {
    data: projects,
    setData: setProjects,
    loading,
    error,
    reload,
  } = useResource(loader);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteProject, setDeleteProject] = useState<ProjectSummaryDto | null>(
    null,
  );

  async function createProject(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const created = await projectApi.create({ name, description });
      setProjects((items) => (items ? [created, ...items] : [created]));
      setName("");
      setDescription("");
      setOpen(false);
    } catch (reason) {
      setFormError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível criar o projeto.",
      );
    } finally {
      setSubmitting(false);
    }
  }
  async function removeProject(id: string) {
    await projectApi.delete(id);
    setProjects((items) => items?.filter((item) => item.id !== id) ?? []);
  }

  return (
    <div className="page-shell">
      <header className="page-heading flex-row items-end justify-between">
        <div>
          <p className="eyebrow">Sua biblioteca</p>
          <h1>Projetos</h1>
          <p>Organize objetivos grandes em próximos passos claros.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" /> Novo projeto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar projeto</DialogTitle>
              <DialogDescription>
                Dê um nome ao seu próximo objetivo. Você poderá adicionar
                matérias e tópicos depois.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={createProject} className="space-y-4">
              <label className="block space-y-2 text-xs font-medium">
                <span>Nome do projeto</span>
                <Input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ex: ENEM 2027"
                  autoFocus
                  required
                />
              </label>
              <label className="block space-y-2 text-xs font-medium">
                <span>
                  Descrição{" "}
                  <span className="text-[var(--muted-foreground)]">
                    (opcional)
                  </span>
                </span>
                <Textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Qual é o seu objetivo?"
                />
              </label>
              {formError && (
                <p className="text-xs text-[var(--danger)]">{formError}</p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Criando…" : "Criar projeto"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </header>
      {loading && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-72 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--surface)]"
            />
          ))}
        </div>
      )}
      {error && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <AlertCircle className="size-6 text-[var(--danger)]" />
            <p className="text-sm">{error}</p>
            <Button variant="secondary" onClick={() => void reload()}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      )}
      {!loading && !error && projects?.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <BookOpen className="mx-auto size-7 text-[var(--muted-foreground)]" />
            <h2 className="mt-4 font-display text-lg">
              Seu primeiro projeto começa aqui
            </h2>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Crie um projeto para organizar matérias e tópicos.
            </p>
            <Button className="mt-5" onClick={() => setOpen(true)}>
              <Plus className="size-4" /> Criar projeto
            </Button>
          </CardContent>
        </Card>
      )}
      {!loading && !error && !!projects?.length && (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project, index) => {
            const accent = accents[index % accents.length];
            return (
              <Link
                href={`/projetos/${project.id}`}
                key={project.id}
                className="group"
              >
                <Card className="h-full overflow-hidden transition duration-300 hover:-translate-y-1 hover:border-[var(--border-strong)] hover:shadow-[0_24px_70px_rgba(0,0,0,.25)]">
                  <div
                    className="h-1 w-full opacity-70"
                    style={{ background: accent }}
                  />
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex items-start justify-between">
                      <div className="grid size-10 place-items-center rounded-lg bg-[var(--surface-3)]">
                        <BookOpen
                          className="size-4"
                          style={{ color: accent }}
                        />
                      </div>
                      <button
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          setDeleteProject(project);
                        }}
                        className="rounded-md p-1 text-[var(--muted-foreground)] hover:bg-[var(--surface-3)] hover:text-[var(--danger)]"
                        aria-label="Excluir projeto"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    <h2 className="mt-7 font-display text-2xl font-semibold tracking-tight">
                      {project.name}
                    </h2>
                    <p className="mt-2 min-h-10 text-sm leading-relaxed text-[var(--muted-foreground)]">
                      {project.description || "Sem descrição."}
                    </p>
                    <div className="mt-7">
                      <div className="mb-2 flex justify-between text-[11px] text-[var(--muted-foreground)]">
                        <span>Progresso</span>
                        <span>{project.progress}%</span>
                      </div>
                      <div className="h-1 overflow-hidden rounded-full bg-[var(--surface-3)]">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${project.progress}%`,
                            background: accent,
                          }}
                        />
                      </div>
                    </div>
                    <div className="mt-5 flex items-center gap-4 border-t border-[var(--border)] pt-4 text-xs text-[var(--muted-foreground)]">
                      <span>{project.subjectCount} matérias</span>
                      <span>{project.topicCount} tópicos</span>
                      <span className="ml-auto flex items-center gap-1">
                        <Clock3 className="size-3" />
                        {formatDuration(project.studiedSeconds)}
                      </span>
                      <ArrowUpRight className="size-3.5 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
          <button
            onClick={() => setOpen(true)}
            className="group min-h-72 rounded-xl border border-dashed border-[var(--border-strong)] text-[var(--muted-foreground)] transition hover:border-[var(--accent-primary-border)] hover:bg-[var(--accent-primary-muted)] hover:text-[var(--foreground)]"
          >
            <span className="mx-auto grid size-10 place-items-center rounded-full border border-[var(--border-strong)] transition group-hover:scale-110">
              <Plus className="size-4" />
            </span>
            <span className="mt-3 block text-sm">Adicionar projeto</span>
          </button>
        </section>
      )}
      {deleteProject && (
        <ConfirmDialog
          key={deleteProject.id}
          open
          title="Excluir projeto?"
          description={`O projeto “${deleteProject.name}”, suas matérias, tópicos e sessões serão excluídos permanentemente.`}
          confirmLabel="Excluir projeto"
          onOpenChange={(open) => {
            if (!open) setDeleteProject(null);
          }}
          onConfirm={() => removeProject(deleteProject.id)}
        />
      )}
    </div>
  );
}
