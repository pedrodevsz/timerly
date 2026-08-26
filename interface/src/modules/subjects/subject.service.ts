import { getPrisma } from "@/lib/db/prisma";
import { notFound } from "@/lib/errors/app-error";
import type { SubjectDto } from "@/types/domain";
import { subjectRepository } from "./subject.repository";
import type { CreateSubjectInput, UpdateSubjectInput } from "./subject.schema";

type SubjectRecord = NonNullable<Awaited<ReturnType<typeof subjectRepository.findById>>>;
function dto(subject: SubjectRecord): SubjectDto { return { id: subject.id, name: subject.name, projectId: subject.projectId, progress: subject.topics.length ? Math.round(subject.topics.filter((topic) => topic.completed).length / subject.topics.length * 100) : 0, topics: subject.topics.map((topic) => ({ id: topic.id, name: topic.name, completed: topic.completed, subjectId: topic.subjectId })) }; }
async function requireSubject(id: string) { const subject = await subjectRepository.findById(id); if (!subject) throw notFound("SUBJECT_NOT_FOUND", "Matéria não encontrada."); return subject; }

export const subjectService = {
  async create(projectId: string, input: CreateSubjectInput) { if (!await getPrisma().project.findUnique({ where: { id: projectId }, select: { id: true } })) throw notFound("PROJECT_NOT_FOUND", "Projeto não encontrado."); return dto(await subjectRepository.create(projectId, input)); },
  async update(id: string, input: UpdateSubjectInput) { await requireSubject(id); return dto(await subjectRepository.update(id, input)); },
  async delete(id: string) { await requireSubject(id); await subjectRepository.delete(id); },
};
