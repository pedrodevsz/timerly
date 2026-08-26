import { getPrisma } from "@/lib/db/prisma";
import type { CreateSubjectInput, UpdateSubjectInput } from "./subject.schema";

const include = { topics: { orderBy: { id: "asc" as const } } };
export const subjectRepository = {
  findById: (id: string) => getPrisma().subject.findUnique({ where: { id }, include }),
  create: (projectId: string, data: CreateSubjectInput) => getPrisma().subject.create({ data: { ...data, projectId }, include }),
  update: (id: string, data: UpdateSubjectInput) => getPrisma().subject.update({ where: { id }, data, include }),
  delete: (id: string) => getPrisma().subject.delete({ where: { id } }),
};
