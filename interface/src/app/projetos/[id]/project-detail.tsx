"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronDown,
  Circle,
  MoreHorizontal,
  Pencil,
  Play,
  Plus,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EditProjectDialog } from "@/components/projects/edit-project-dialog";
import { CreateTopicDialog } from "@/components/subjects/create-topic-dialog";
import { SubjectDialog } from "@/components/subjects/subject-dialog";
import { useTimer } from "@/contexts/timer-context";
import { useResource } from "@/hooks/use-resource";
import { projectApi } from "@/services/project-service";
import type { SubjectDto, TopicDto } from "@/types/domain";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function formatDuration(seconds: number) {
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

export function ProjectDetail({ projectId }: { projectId: string }) {
  const loader = useCallback(() => projectApi.get(projectId), [projectId]);
  const {
    data: project,
    setData: setProject,
    loading,
    error,
    reload,
  } = useResource(loader);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [subjectDialog, setSubjectDialog] = useState<
    { mode: "create" } | { mode: "edit"; subject: SubjectDto } | null
  >(null);
  const [topicSubject, setTopicSubject] = useState<SubjectDto | null>(null);
  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<
    | { type: "subject"; id: string; name: string }
    | { type: "topic"; id: number; name: string }
    | null
  >(null);
  const { startSession } = useTimer();

  async function toggleTopic(topicId: number, completed: boolean) {
    try {
      await projectApi.updateTopic(topicId, { completed: !completed });
      setProject((current) => {
        if (!current) return current;
        const subjects = current.subjects.map((subject) => {
          const topics = subject.topics.map((topic) =>
            topic.id === topicId ? { ...topic, completed: !completed } : topic,
          );
          return {
            ...subject,
            topics,
            progress: topics.length
              ? Math.round(
                  (topics.filter((topic) => topic.completed).length /
                    topics.length) *
                    100,
                )
              : 0,
          };
        });
        const topics = subjects.flatMap((subject) => subject.topics);
        return {
          ...current,
          subjects,
          progress: topics.length
            ? Math.round(
                (topics.filter((topic) => topic.completed).length /
                  topics.length) *
                  100,
              )
            : 0,
        };
      });
    } catch (reason) {
      toast.error(
        reason instanceof Error
          ? reason.message
          : "Não foi possível atualizar o tópico.",
      );
    }
  }

  async function removeSelected() {
    if (!deleteTarget) return;
    if (deleteTarget.type === "subject")
      await projectApi.deleteSubject(deleteTarget.id);
    else await projectApi.deleteTopic(deleteTarget.id);
    setProject((current) => {
      if (!current) return current;
      const subjects =
        deleteTarget.type === "subject"
          ? current.subjects.filter((subject) => subject.id !== deleteTarget.id)
          : current.subjects.map((subject) => {
              const topics = subject.topics.filter(
                (topic) => topic.id !== deleteTarget.id,
              );
              return {
                ...subject,
                topics,
                progress: topics.length
                  ? Math.round(
                      (topics.filter((topic) => topic.completed).length /
                        topics.length) *
                        100,
                    )
                  : 0,
              };
            });
      const topics = subjects.flatMap((subject) => subject.topics);
      return {
        ...current,
        subjects,
        subjectCount: subjects.length,
        topicCount: topics.length,
        progress: topics.length
          ? Math.round(
              (topics.filter((topic) => topic.completed).length /
                topics.length) *
                100,
            )
          : 0,
      };
    });
  }

  function subjectSaved(saved: SubjectDto, created: boolean) {
    setProject((current) => {
      if (!current) return current;
      const subjects = created
        ? [...current.subjects, saved]
        : current.subjects.map((subject) =>
            subject.id === saved.id ? saved : subject,
          );
      return { ...current, subjects, subjectCount: subjects.length };
    });
    if (created) setExpanded((items) => [...items, saved.id]);
  }

  function topicCreated(topic: TopicDto) {
    setProject((current) => {
      if (!current) return current;
      const subjects = current.subjects.map((subject) => {
        if (subject.id !== topic.subjectId) return subject;
        const topics = [...subject.topics, topic];
        return {
          ...subject,
          topics,
          progress: Math.round(
            (topics.filter((item) => item.completed).length / topics.length) *
              100,
          ),
        };
      });
      const topics = subjects.flatMap((subject) => subject.topics);
      return {
        ...current,
        subjects,
        topicCount: topics.length,
        progress: topics.length
          ? Math.round(
              (topics.filter((item) => item.completed).length / topics.length) *
                100,
            )
          : 0,
      };
    });
  }

  if (loading)
    return (
      <div className="page-shell">
        <div className="h-12 w-64 animate-pulse rounded-lg bg-[var(--surface)]" />
        <div className="mt-10 space-y-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-24 animate-pulse rounded-xl bg-[var(--surface)]"
            />
          ))}
        </div>
      </div>
    );
  if (error || !project)
    return (
      <div className="page-shell">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16">
            <AlertCircle className="size-6 text-[var(--danger)]" />
            <p className="text-sm">{error ?? "Projeto não encontrado."}</p>
            <Button variant="secondary" onClick={() => void reload()}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  return (
    <div className="page-shell">
      <Link
        href="/projetos"
        className="mb-6 inline-flex items-center gap-2 text-xs text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
      >
        <ArrowLeft className="size-3.5" /> Voltar para projetos
      </Link>
      <header className="page-heading flex-row items-end justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Badge>Projeto ativo</Badge>
            <span className="text-xs text-[var(--muted-foreground)]">
              Dados persistidos
            </span>
          </div>
          <h1>{project.name}</h1>
          <p>{project.description || "Sem descrição."}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setEditProjectOpen(true)}
            aria-label="Editar projeto"
          >
            <MoreHorizontal className="size-4" />
          </Button>
          <Button onClick={() => setSubjectDialog({ mode: "create" })}>
            <Plus className="size-4" />{" "}
            <span className="hidden sm:inline">Nova matéria</span>
          </Button>
        </div>
      </header>
      <section className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="mini-stat">
          <span>Progresso geral</span>
          <strong>{project.progress}%</strong>
        </div>
        <div className="mini-stat">
          <span>Tempo estudado</span>
          <strong>{formatDuration(project.studiedSeconds)}</strong>
        </div>
        <div className="mini-stat">
          <span>Matérias</span>
          <strong>{project.subjectCount}</strong>
        </div>
        <div className="mini-stat">
          <span>Tópicos concluídos</span>
          <strong>
            {
              project.subjects
                .flatMap((item) => item.topics)
                .filter((item) => item.completed).length
            }{" "}
            <small>/ {project.topicCount}</small>
          </strong>
        </div>
      </section>
      {project.subjects.length === 0 && (
        <Card>
          <CardContent className="py-14 text-center">
            <p className="text-sm text-[var(--muted-foreground)]">
              Ainda não há matérias neste projeto.
            </p>
            <Button
              className="mt-4"
              onClick={() => setSubjectDialog({ mode: "create" })}
            >
              <Plus className="size-4" /> Adicionar matéria
            </Button>
          </CardContent>
        </Card>
      )}
      <div className="space-y-3">
        {project.subjects.map((subject) => {
          const isOpen = expanded.includes(subject.id);
          const done = subject.topics.filter((topic) => topic.completed).length;
          return (
            <Card key={subject.id} className="overflow-hidden">
              <div className="flex items-center">
                <button
                  onClick={() =>
                    setExpanded((items) =>
                      items.includes(subject.id)
                        ? items.filter((id) => id !== subject.id)
                        : [...items, subject.id],
                    )
                  }
                  className="flex flex-1 items-center gap-4 p-5 text-left sm:p-6"
                >
                  <span className="grid size-9 place-items-center rounded-lg bg-[var(--accent-primary-muted)] font-display text-sm font-semibold text-[var(--accent-primary)]">
                    {subject.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <h2 className="font-display text-lg font-semibold">
                        {subject.name}
                      </h2>
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {done} de {subject.topics.length}
                      </span>
                    </div>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-[var(--surface-3)]">
                      <div
                        className="h-full bg-[var(--accent-primary)]"
                        style={{ width: `${subject.progress}%` }}
                      />
                    </div>
                  </div>
                  <ChevronDown
                    className={cn(
                      "size-4 text-[var(--muted-foreground)] transition",
                      isOpen && "rotate-180",
                    )}
                  />
                </button>
                <button
                  onClick={() => setSubjectDialog({ mode: "edit", subject })}
                  className="rounded-md p-2 text-[var(--muted-foreground)] hover:bg-[var(--surface-3)] hover:text-[var(--foreground)]"
                  aria-label={`Editar ${subject.name}`}
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  onClick={() =>
                    setDeleteTarget({
                      type: "subject",
                      id: subject.id,
                      name: subject.name,
                    })
                  }
                  className="mr-5 rounded-md p-2 text-[var(--muted-foreground)] hover:bg-[var(--surface-3)] hover:text-[var(--danger)]"
                  aria-label="Excluir matéria"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              {isOpen && (
                <CardContent className="border-t border-[var(--border)] px-5 py-2 sm:px-6">
                  <div className="divide-y divide-[var(--border)]">
                    {subject.topics.map((topic) => (
                      <div
                        key={topic.id}
                        className="group flex items-center gap-3 py-3"
                      >
                        <button
                          onClick={() =>
                            void toggleTopic(topic.id, topic.completed)
                          }
                          className={cn(
                            "grid size-5 place-items-center rounded-full border transition",
                            topic.completed
                              ? "border-[var(--positive)] bg-[var(--positive)] text-[var(--surface)]"
                              : "border-[var(--border-strong)] text-transparent hover:border-[var(--accent-primary)]",
                          )}
                          aria-label={
                            topic.completed
                              ? "Marcar pendente"
                              : "Marcar concluído"
                          }
                        >
                          {topic.completed ? (
                            <Check className="size-3" />
                          ) : (
                            <Circle className="size-2" />
                          )}
                        </button>
                        <span
                          className={cn(
                            "flex-1 text-sm",
                            topic.completed &&
                              "text-[var(--muted-foreground)] line-through decoration-[var(--border-strong)]",
                          )}
                        >
                          {topic.name}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                          onClick={() => void startSession(topic.id)}
                        >
                          <Play className="size-3 fill-current" /> Estudar
                        </Button>
                        <button
                          onClick={() =>
                            setDeleteTarget({
                              type: "topic",
                              id: topic.id,
                              name: topic.name,
                            })
                          }
                          className="rounded p-1 text-[var(--muted-foreground)] opacity-100 hover:text-[var(--danger)] sm:opacity-0 sm:group-hover:opacity-100"
                          aria-label="Excluir tópico"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setTopicSubject(subject)}
                    className="my-2 flex items-center gap-2 py-2 text-xs text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
                  >
                    <Plus className="size-3.5" /> Adicionar tópico
                  </button>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
      {editProjectOpen && (
        <EditProjectDialog
          key={project.id}
          open
          project={project}
          onOpenChange={setEditProjectOpen}
          onSaved={setProject}
        />
      )}
      {subjectDialog && (
        <SubjectDialog
          key={
            subjectDialog.mode === "edit"
              ? subjectDialog.subject.id
              : "create-subject"
          }
          open
          projectId={projectId}
          subject={
            subjectDialog.mode === "edit" ? subjectDialog.subject : undefined
          }
          onOpenChange={(open) => {
            if (!open) setSubjectDialog(null);
          }}
          onSaved={subjectSaved}
        />
      )}
      {topicSubject && (
        <CreateTopicDialog
          key={topicSubject.id}
          open
          subject={topicSubject}
          onOpenChange={(open) => {
            if (!open) setTopicSubject(null);
          }}
          onCreated={topicCreated}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          key={`${deleteTarget.type}-${deleteTarget.id}`}
          open
          title={
            deleteTarget.type === "subject"
              ? "Excluir matéria?"
              : "Excluir tópico?"
          }
          description={
            deleteTarget.type === "subject"
              ? `A matéria “${deleteTarget.name}”, seus tópicos e sessões serão excluídos permanentemente.`
              : `O tópico “${deleteTarget.name}” e suas sessões serão excluídos permanentemente.`
          }
          confirmLabel={
            deleteTarget.type === "subject"
              ? "Excluir matéria"
              : "Excluir tópico"
          }
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
          onConfirm={removeSelected}
        />
      )}
    </div>
  );
}
