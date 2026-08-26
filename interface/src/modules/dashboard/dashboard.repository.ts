import { getPrisma } from "@/lib/db/prisma";
import { sessionInclude } from "@/modules/study-sessions/study-session.repository";

export const dashboardRepository = {
  sessions: () => getPrisma().studySession.findMany({ where: { status: "COMPLETED" }, orderBy: { startedAt: "desc" }, include: sessionInclude }),
};
