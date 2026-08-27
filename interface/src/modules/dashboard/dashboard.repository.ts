import { getPrisma } from "@/lib/db/prisma";
import { sessionInclude } from "@/modules/study-sessions/study-session.repository";

export const dashboardRepository = {
  sessions: (userId: string) =>
    getPrisma().studySession.findMany({
      where: { userId, status: "COMPLETED" },
      orderBy: { startedAt: "desc" },
      include: sessionInclude,
    }),
};
