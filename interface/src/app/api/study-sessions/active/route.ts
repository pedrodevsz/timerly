import { ok, withErrorHandling } from "@/lib/http/responses";
import { studySessionService } from "@/modules/study-sessions/study-session.service";
import { requireUser } from "@/lib/auth/require-user";

export const dynamic = "force-dynamic";
export const GET = withErrorHandling(async () => {
  const user = await requireUser();

  return ok(await studySessionService.active(user.id));
});
