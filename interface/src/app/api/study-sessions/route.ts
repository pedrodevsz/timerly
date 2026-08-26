import { ok, validatedBody, withErrorHandling } from "@/lib/http/responses";
import { createStudySessionSchema } from "@/modules/study-sessions/study-session.schema";
import { studySessionService } from "@/modules/study-sessions/study-session.service";

export const dynamic = "force-dynamic";
export const GET = withErrorHandling(async () => ok(await studySessionService.list()));
export const POST = withErrorHandling(async (request: Request) => ok(await studySessionService.create(await validatedBody(request, createStudySessionSchema)), { status: 201 }));
