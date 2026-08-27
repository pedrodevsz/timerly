import { noContent, ok, validatedBody, withErrorHandling } from "@/lib/http/responses";
import { topicIdSchema, updateTopicSchema } from "@/modules/topics/topic.schema";
import { topicService } from "@/modules/topics/topic.service";
import { requireUser } from "@/lib/auth/require-user";
import { assertSameOrigin } from "@/lib/http/csrf";

export const PATCH = withErrorHandling(
  async (
    request: Request,
    context: RouteContext<"/api/topics/[topicId]">,
  ) => {
    assertSameOrigin(request);

    const user = await requireUser();
    const { topicId } = await context.params;

    return ok(
      await topicService.update(
        user.id,
        topicIdSchema.parse(topicId),
        await validatedBody(request, updateTopicSchema),
      ),
    );
  },
);

export const DELETE = withErrorHandling(
  async (
    request: Request,
    context: RouteContext<"/api/topics/[topicId]">,
  ) => {
    assertSameOrigin(request);

    const user = await requireUser();
    const { topicId } = await context.params;

    await topicService.delete(user.id, topicIdSchema.parse(topicId));

    return noContent();
  },
);
