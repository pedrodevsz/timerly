import { notFound } from "@/lib/errors/app-error";
import type { TopicDto } from "@/types/domain";
import { subjectRepository } from "@/modules/subjects/subject.repository";
import { topicRepository } from "./topic.repository";
import type { CreateTopicInput, UpdateTopicInput } from "./topic.schema";

function dto(topic: NonNullable<Awaited<ReturnType<typeof topicRepository.findById>>>): TopicDto { return { id: topic.id, name: topic.name, completed: topic.completed, subjectId: topic.subjectId }; }
async function requireTopic(id: number) { const topic = await topicRepository.findById(id); if (!topic) throw notFound("TOPIC_NOT_FOUND", "Tópico não encontrado."); return topic; }
export const topicService = {
  async create(subjectId: string, input: CreateTopicInput) { if (!await subjectRepository.findById(subjectId)) throw notFound("SUBJECT_NOT_FOUND", "Matéria não encontrada."); return dto(await topicRepository.create(subjectId, input)); },
  async update(id: number, input: UpdateTopicInput) { await requireTopic(id); return dto(await topicRepository.update(id, input)); },
  async delete(id: number) { await requireTopic(id); await topicRepository.delete(id); },
};
