import { getPrisma } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";

export const sessionInclude = {
  topic: {
    include: {
      subject: {
        include: { project: true },
      },
    },
  },
} as const;

export const studySessionRepository = {
  findActive: (userId: string) =>
    getPrisma().studySession.findFirst({
      where: { userId, status: { in: ["ACTIVE", "PAUSED"] } },
      orderBy: { startedAt: "desc" },
      include: sessionInclude,
    }),
  findById: (userId: string, id: number) =>
    getPrisma().studySession.findFirst({
      where: { id, userId },
      include: sessionInclude,
    }),
  list: (userId: string, take = 25) =>
    getPrisma().studySession.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
      take,
      include: sessionInclude,
    }),
  create: (userId: string, topicId: number, now: Date) =>
    getPrisma().studySession.create({
      data: {
        userId,
        topicId,
        startedAt: now,
        lastResumedAt: now,
        status: "ACTIVE",
      },
      include: sessionInclude,
    }),
  update: (id: number, data: Prisma.StudySessionUpdateInput) =>
    getPrisma().studySession.update({
      where: { id },
      data,
      include: sessionInclude,
    }),
};
