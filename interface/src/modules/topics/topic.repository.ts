import { getPrisma } from "@/lib/db/prisma";
import { normalizeTopicName } from "@/lib/topics/parse-bulk-topics";
import type { CreateTopicInput, UpdateTopicInput } from "./topic.schema";

export const topicRepository = {
  findById: (userId: string, id: number) =>
    getPrisma().topic.findFirst({
      where: { id, subject: { project: { userId } } },
    }),
  create: (subjectId: string, data: CreateTopicInput) =>
    getPrisma().topic.create({ data: { ...data, subjectId } }),
  createMany: (subjectId: string, names: string[]) =>
    getPrisma().$transaction(async (transaction) => {
      await transaction.$executeRaw`
        SELECT pg_advisory_xact_lock(hashtext(${subjectId}))
      `;

      const existing = await transaction.topic.findMany({
        where: { subjectId },
        select: { name: true },
      });
      const existingNames = new Set(
        existing.map((topic) => normalizeTopicName(topic.name)),
      );
      const skipped = names.filter((name) =>
        existingNames.has(normalizeTopicName(name)),
      );
      const namesToCreate = names.filter(
        (name) => !existingNames.has(normalizeTopicName(name)),
      );

      if (namesToCreate.length > 0) {
        await transaction.topic.createMany({
          data: namesToCreate.map((name) => ({ name, subjectId })),
        });
      }

      const created =
        namesToCreate.length > 0
          ? await transaction.topic.findMany({
              where: { subjectId, name: { in: namesToCreate } },
              orderBy: { id: "asc" },
            })
          : [];

      return { created, skipped };
    }),
  update: (id: number, data: UpdateTopicInput) =>
    getPrisma().topic.update({ where: { id }, data }),
  delete: (id: number) => getPrisma().topic.delete({ where: { id } }),
};
