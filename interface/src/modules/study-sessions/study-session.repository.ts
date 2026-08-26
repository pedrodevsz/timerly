import { getPrisma } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";

export const sessionInclude = { topic: { include: { subject: { include: { project: true } } } } } as const;

export const studySessionRepository = {
  findActive: () => getPrisma().studySession.findFirst({ where: { status: { in: ["ACTIVE", "PAUSED"] } }, orderBy: { startedAt: "desc" }, include: sessionInclude }),
  findById: (id: number) => getPrisma().studySession.findUnique({ where: { id }, include: sessionInclude }),
  list: (take = 25) => getPrisma().studySession.findMany({ orderBy: { startedAt: "desc" }, take, include: sessionInclude }),
  create: (topicId: number, now: Date) => getPrisma().studySession.create({ data: { topicId, startedAt: now, lastResumedAt: now, status: "ACTIVE" }, include: sessionInclude }),
  update: (id: number, data: Prisma.StudySessionUpdateInput) => getPrisma().studySession.update({ where: { id }, data, include: sessionInclude }),
};
