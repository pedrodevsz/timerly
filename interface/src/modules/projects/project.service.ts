import { notFound } from "@/lib/errors/app-error";
import { runningDuration } from "@/lib/time/duration";
import type { ProjectDetailDto, ProjectSummaryDto, SubjectDto } from "@/types/domain";
import type { CreateProjectInput, UpdateProjectInput } from "./project.schema";
import { projectRepository } from "./project.repository";

type ProjectRecord = Awaited<ReturnType<typeof projectRepository.findById>>;

function metrics(project: NonNullable<ProjectRecord>) {
  const topics = project.subjects.flatMap((subject) => subject.topics);
  const completed = topics.filter((topic) => topic.completed).length;
  const studiedSeconds = topics.flatMap((topic) => topic.sessions).reduce((total, session) => total + (session.status === "ACTIVE" ? runningDuration(session.durationSeconds, session.lastResumedAt) : session.durationSeconds), 0);
  return { progress: topics.length ? Math.round((completed / topics.length) * 100) : 0, subjectCount: project.subjects.length, topicCount: topics.length, studiedSeconds };
}

function summary(project: NonNullable<ProjectRecord>): ProjectSummaryDto {
  return { id: project.id, name: project.name, description: project.description, updatedAt: project.updatedAt.toISOString(), ...metrics(project) };
}

function detail(project: NonNullable<ProjectRecord>): ProjectDetailDto {
  const subjects: SubjectDto[] = project.subjects.map((subject) => ({
    id: subject.id,
    name: subject.name,
    projectId: subject.projectId,
    progress: subject.topics.length ? Math.round(subject.topics.filter((topic) => topic.completed).length / subject.topics.length * 100) : 0,
    topics: subject.topics.map((topic) => ({ id: topic.id, name: topic.name, completed: topic.completed, subjectId: topic.subjectId })),
  }));
  return { ...summary(project), subjects };
}

async function requireProject(id: string) {
  const project = await projectRepository.findById(id);
  if (!project) throw notFound("PROJECT_NOT_FOUND", "Projeto não encontrado.");
  return project;
}

export const projectService = {
  async list() { return (await projectRepository.list()).map(summary); },
  async get(id: string) { return detail(await requireProject(id)); },
  async create(input: CreateProjectInput) { return detail(await projectRepository.create(input)); },
  async update(id: string, input: UpdateProjectInput) { await requireProject(id); return detail(await projectRepository.update(id, input)); },
  async delete(id: string) { await requireProject(id); await projectRepository.delete(id); },
};
