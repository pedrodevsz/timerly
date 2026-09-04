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
  manualOptions: (userId: string) =>
    getPrisma().subject.findMany({
      where: { project: { userId } },
      orderBy: [{ project: { createdAt: "asc" } }, { createdAt: "asc" }],
      select: {
        id: true,
        name: true,
        project: { select: { id: true, name: true } },
        topics: {
          orderBy: { id: "asc" },
          select: {
            id: true,
            name: true,
            completed: true,
            subjectId: true,
          },
        },
      },
    }),
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
  create: (userId: string, topicId: number, occurredAt: Date) =>
    getPrisma().studySession.create({
      data: {
        userId,
        topicId,
        startedAt: occurredAt,
        lastResumedAt: occurredAt,
        lastTransitionAt: occurredAt,
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
