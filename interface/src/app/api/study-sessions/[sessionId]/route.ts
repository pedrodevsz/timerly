import { ok, validatedBody, withErrorHandling } from "@/lib/http/responses";
import { sessionIdSchema, updateStudySessionSchema } from "@/modules/study-sessions/study-session.schema";
import { studySessionService } from "@/modules/study-sessions/study-session.service";

export const PATCH = withErrorHandling(async (request: Request, context: RouteContext<"/api/study-sessions/[sessionId]">) => { const { sessionId } = await context.params; return ok(await studySessionService.update(sessionIdSchema.parse(sessionId), await validatedBody(request, updateStudySessionSchema))); });
