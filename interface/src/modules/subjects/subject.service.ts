import { getPrisma } from "@/lib/db/prisma";
import { notFound } from "@/lib/errors/app-error";
import type { SubjectDto } from "@/types/domain";
import { subjectRepository } from "./subject.repository";
import type { CreateSubjectInput, UpdateSubjectInput } from "./subject.schema";

type SubjectRecord = NonNullable<Awaited<ReturnType<typeof subjectRepository.findById>>>;
function dto(subject: SubjectRecord): SubjectDto {
  return {
    id: subject.id,
    name: subject.name,
    projectId: subject.projectId,
    progress: subject.topics.length
      ? Math.round(
          (subject.topics.filter((topic) => topic.completed).length /
            subject.topics.length) *
            100,
        )
      : 0,
    topics: subject.topics.map((topic) => ({
      id: topic.id,
      name: topic.name,
      completed: topic.completed,
      subjectId: topic.subjectId,
    })),
  };
}
async function requireSubject(userId: string, id: string) {
  const subject = await subjectRepository.findById(userId, id);
  if (!subject) throw notFound("SUBJECT_NOT_FOUND", "Matéria não encontrada.");
  return subject;
}

export const subjectService = {
  async create(userId: string, projectId: string, input: CreateSubjectInput) {
    if (
      !(await getPrisma().project.findFirst({
        where: { id: projectId, userId },
        select: { id: true },
      }))
    )
      throw notFound("PROJECT_NOT_FOUND", "Projeto não encontrado.");
    return dto(await subjectRepository.create(projectId, input));
  },
  async update(userId: string, id: string, input: UpdateSubjectInput) {
    await requireSubject(userId, id);
    return dto(await subjectRepository.update(id, input));
  },
  async delete(userId: string, id: string) {
    await requireSubject(userId, id);
    await subjectRepository.delete(id);
  },
};
