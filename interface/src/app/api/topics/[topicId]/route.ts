import { noContent, ok, validatedBody, withErrorHandling } from "@/lib/http/responses";
import { topicIdSchema, updateTopicSchema } from "@/modules/topics/topic.schema";
import { topicService } from "@/modules/topics/topic.service";

export const PATCH = withErrorHandling(async (request: Request, context: RouteContext<"/api/topics/[topicId]">) => { const { topicId } = await context.params; return ok(await topicService.update(topicIdSchema.parse(topicId), await validatedBody(request, updateTopicSchema))); });
export const DELETE = withErrorHandling(async (_request: Request, context: RouteContext<"/api/topics/[topicId]">) => { const { topicId } = await context.params; await topicService.delete(topicIdSchema.parse(topicId)); return noContent(); });
