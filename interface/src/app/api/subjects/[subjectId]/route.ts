import { noContent, ok, validatedBody, withErrorHandling } from "@/lib/http/responses";
import { subjectIdSchema, updateSubjectSchema } from "@/modules/subjects/subject.schema";
import { subjectService } from "@/modules/subjects/subject.service";
import { requireUser } from "@/lib/auth/require-user";
import { assertSameOrigin } from "@/lib/http/csrf";

export const PATCH = withErrorHandling(
  async (
    request: Request,
    context: RouteContext<"/api/subjects/[subjectId]">,
  ) => {
    assertSameOrigin(request);

    const user = await requireUser();
    const { subjectId } = await context.params;

    return ok(
      await subjectService.update(
        user.id,
        subjectIdSchema.parse(subjectId),
        await validatedBody(request, updateSubjectSchema),
      ),
    );
  },
);

export const DELETE = withErrorHandling(
  async (
    request: Request,
    context: RouteContext<"/api/subjects/[subjectId]">,
  ) => {
    assertSameOrigin(request);

    const user = await requireUser();
    const { subjectId } = await context.params;

    await subjectService.delete(user.id, subjectIdSchema.parse(subjectId));

    return noContent();
  },
);
