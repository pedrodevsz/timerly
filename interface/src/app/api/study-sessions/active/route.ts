import { ok, withErrorHandling } from "@/lib/http/responses";
import { studySessionService } from "@/modules/study-sessions/study-session.service";

export const dynamic = "force-dynamic";
export const GET = withErrorHandling(async () => ok(await studySessionService.active()));
