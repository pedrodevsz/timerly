import "server-only";
import { getPrisma } from "@/lib/db/prisma";

export const safeUserSelect = {
  id: true,
  name: true,
  email: true,
} as const;

export const userRepository = {
  findCredentialsByEmail: (email: string) =>
    getPrisma().user.findUnique({
      where: { email },
      select: { ...safeUserSelect, passwordHash: true },
    }),
  findSafeById: (id: string) =>
    getPrisma().user.findUnique({ where: { id }, select: safeUserSelect }),
};
