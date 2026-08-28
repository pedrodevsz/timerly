import { getPrisma } from "@/lib/db/prisma";
import type { CreateProjectInput, UpdateProjectInput } from "./project.schema";

const projectInclude = {
  subjects: {
    orderBy: { createdAt: "asc" as const },
    include: {
      topics: {
        orderBy: { id: "asc" as const },
        include: { sessions: { select: { durationSeconds: true, status: true, lastResumedAt: true } } },
      },
    },
  },
};

export const projectRepository = {
  list: (userId: string) =>
    getPrisma().project.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: projectInclude,
    }),
  findById: (userId: string, id: string) =>
    getPrisma().project.findFirst({
      where: { id, userId },
      include: projectInclude,
    }),
  create: (userId: string, data: CreateProjectInput) =>
    getPrisma().project.create({
      data: { ...data, userId },
      include: projectInclude,
    }),
  update: (id: string, data: UpdateProjectInput) =>
    getPrisma().project.update({
      where: { id },
      data,
      include: projectInclude,
    }),
  delete: (id: string) => getPrisma().project.delete({ where: { id } }),
};
