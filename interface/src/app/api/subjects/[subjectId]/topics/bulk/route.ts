import { requireUser } from "@/lib/auth/require-user";
import { assertSameOrigin } from "@/lib/http/csrf";
import { ok, validatedBody, withErrorHandling } from "@/lib/http/responses";
import { subjectIdSchema } from "@/modules/subjects/subject.schema";
import { createBulkTopicsSchema } from "@/modules/topics/topic.schema";
import { topicService } from "@/modules/topics/topic.service";

export const POST = withErrorHandling(
  async (
    request: Request,
    context: { params: Promise<{ subjectId: string }> },
  ) => {
    assertSameOrigin(request);

    const user = await requireUser();
    const { subjectId } = await context.params;

    return ok(
      await topicService.createMany(
        user.id,
        subjectIdSchema.parse(subjectId),
        await validatedBody(request, createBulkTopicsSchema),
      ),
      { status: 201 },
    );
  },
);
