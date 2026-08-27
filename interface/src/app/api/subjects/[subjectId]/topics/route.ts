import { ok, validatedBody, withErrorHandling } from "@/lib/http/responses";
import { subjectIdSchema } from "@/modules/subjects/subject.schema";
import { createTopicSchema } from "@/modules/topics/topic.schema";
import { topicService } from "@/modules/topics/topic.service";
import { requireUser } from "@/lib/auth/require-user";
import { assertSameOrigin } from "@/lib/http/csrf";

export const POST = withErrorHandling(
  async (
    request: Request,
    context: RouteContext<"/api/subjects/[subjectId]/topics">,
  ) => {
    assertSameOrigin(request);

    const user = await requireUser();
    const { subjectId } = await context.params;

    return ok(
      await topicService.create(
        user.id,
        subjectIdSchema.parse(subjectId),
        await validatedBody(request, createTopicSchema),
      ),
      { status: 201 },
    );
  },
);
