import { ok, validatedBody, withErrorHandling } from "@/lib/http/responses";
import { sessionIdSchema, updateStudySessionSchema } from "@/modules/study-sessions/study-session.schema";
import { studySessionService } from "@/modules/study-sessions/study-session.service";
import { requireUser } from "@/lib/auth/require-user";
import { assertSameOrigin } from "@/lib/http/csrf";

export const PATCH = withErrorHandling(
  async (
    request: Request,
    context: RouteContext<"/api/study-sessions/[sessionId]">,
  ) => {
    assertSameOrigin(request);

    const user = await requireUser();
    const { sessionId } = await context.params;

    return ok(
      await studySessionService.update(
        user.id,
        sessionIdSchema.parse(sessionId),
        await validatedBody(request, updateStudySessionSchema),
      ),
    );
  },
);
