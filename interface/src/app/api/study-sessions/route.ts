import { ok, validatedBody, withErrorHandling } from "@/lib/http/responses";
import { createStudySessionSchema } from "@/modules/study-sessions/study-session.schema";
import { studySessionService } from "@/modules/study-sessions/study-session.service";
import { requireUser } from "@/lib/auth/require-user";
import { assertSameOrigin } from "@/lib/http/csrf";

export const dynamic = "force-dynamic";
export const GET = withErrorHandling(async () => {
  const user = await requireUser();

  return ok(await studySessionService.list(user.id));
});

export const POST = withErrorHandling(async (request: Request) => {
  assertSameOrigin(request);

  const user = await requireUser();

  return ok(
    await studySessionService.create(
      user.id,
      await validatedBody(request, createStudySessionSchema),
    ),
    { status: 201 },
  );
});
