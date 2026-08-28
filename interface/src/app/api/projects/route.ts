import { ok, validatedBody, withErrorHandling } from "@/lib/http/responses";
import { createProjectSchema } from "@/modules/projects/project.schema";
import { projectService } from "@/modules/projects/project.service";
import { requireUser } from "@/lib/auth/require-user";
import { assertSameOrigin } from "@/lib/http/csrf";

export const dynamic = "force-dynamic";
export const GET = withErrorHandling(async () => {
  const user = await requireUser();

  return ok(await projectService.list(user.id));
});

export const POST = withErrorHandling(async (request: Request) => {
  assertSameOrigin(request);

  const user = await requireUser();

  return ok(
    await projectService.create(
      user.id,
      await validatedBody(request, createProjectSchema),
    ),
    { status: 201 },
  );
});
