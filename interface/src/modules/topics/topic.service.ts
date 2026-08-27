import { notFound } from "@/lib/errors/app-error";
import { subjectRepository } from "@/modules/subjects/subject.repository";
import type { TopicDto } from "@/types/domain";
import { topicRepository } from "./topic.repository";
import type { CreateTopicInput, UpdateTopicInput } from "./topic.schema";

type TopicRecord = NonNullable<Awaited<ReturnType<typeof topicRepository.findById>>>;
function dto(topic: TopicRecord): TopicDto {
  return {
    id: topic.id,
    name: topic.name,
    completed: topic.completed,
    subjectId: topic.subjectId,
  };
}
async function requireTopic(userId: string, id: number) {
  const topic = await topicRepository.findById(userId, id);
  if (!topic) throw notFound("TOPIC_NOT_FOUND", "Tópico não encontrado.");
  return topic;
}

export const topicService = {
  async create(userId: string, subjectId: string, input: CreateTopicInput) {
    if (!(await subjectRepository.findById(userId, subjectId)))
      throw notFound("SUBJECT_NOT_FOUND", "Matéria não encontrada.");
    return dto(await topicRepository.create(subjectId, input));
  },
  async update(userId: string, id: number, input: UpdateTopicInput) {
    await requireTopic(userId, id);
    return dto(await topicRepository.update(id, input));
  },
  async delete(userId: string, id: number) {
    await requireTopic(userId, id);
    await topicRepository.delete(id);
  },
};
