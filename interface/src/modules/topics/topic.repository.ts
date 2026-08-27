import { getPrisma } from "@/lib/db/prisma";
import type { CreateTopicInput, UpdateTopicInput } from "./topic.schema";

export const topicRepository = {
  findById: (userId: string, id: number) =>
    getPrisma().topic.findFirst({
      where: { id, subject: { project: { userId } } },
    }),
  create: (subjectId: string, data: CreateTopicInput) =>
    getPrisma().topic.create({ data: { ...data, subjectId } }),
  update: (id: number, data: UpdateTopicInput) =>
    getPrisma().topic.update({ where: { id }, data }),
  delete: (id: number) => getPrisma().topic.delete({ where: { id } }),
};
