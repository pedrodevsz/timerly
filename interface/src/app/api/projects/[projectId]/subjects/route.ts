import { ok, validatedBody, withErrorHandling } from "@/lib/http/responses";
import { projectIdSchema } from "@/modules/projects/project.schema";
import { createSubjectSchema } from "@/modules/subjects/subject.schema";
import { subjectService } from "@/modules/subjects/subject.service";
import { requireUser } from "@/lib/auth/require-user";
import { assertSameOrigin } from "@/lib/http/csrf";

export const POST = withErrorHandling(
  async (
    request: Request,
    context: RouteContext<"/api/projects/[projectId]/subjects">,
  ) => {
    assertSameOrigin(request);

    const user = await requireUser();
    const { projectId } = await context.params;

    return ok(
      await subjectService.create(
        user.id,
        projectIdSchema.parse(projectId),
        await validatedBody(request, createSubjectSchema),
      ),
      { status: 201 },
    );
  },
);
