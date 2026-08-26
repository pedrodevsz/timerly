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
  list: () => getPrisma().project.findMany({ orderBy: { updatedAt: "desc" }, include: projectInclude }),
  findById: (id: string) => getPrisma().project.findUnique({ where: { id }, include: projectInclude }),
  create: (data: CreateProjectInput) => getPrisma().project.create({ data, include: projectInclude }),
  update: (id: string, data: UpdateProjectInput) => getPrisma().project.update({ where: { id }, data, include: projectInclude }),
  delete: (id: string) => getPrisma().project.delete({ where: { id } }),
};
