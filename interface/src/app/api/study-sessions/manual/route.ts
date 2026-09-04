import { requireUser } from "@/lib/auth/require-user";
import { assertSameOrigin } from "@/lib/http/csrf";
import { ok, validatedBody, withErrorHandling } from "@/lib/http/responses";
import { createManualStudySessionSchema } from "@/modules/study-sessions/study-session.schema";
import { studySessionService } from "@/modules/study-sessions/study-session.service";

export const dynamic = "force-dynamic";

export const GET = withErrorHandling(async () => {
  const user = await requireUser();
  return ok(await studySessionService.manualOptions(user.id));
});

export const POST = withErrorHandling(async (request: Request) => {
  assertSameOrigin(request);
  const user = await requireUser();
  return ok(
    await studySessionService.createManual(
      user.id,
      await validatedBody(request, createManualStudySessionSchema),
    ),
    { status: 201 },
  );
});
