import { ok, validatedBody, withErrorHandling } from "@/lib/http/responses";
import { subjectIdSchema } from "@/modules/subjects/subject.schema";
import { createTopicSchema } from "@/modules/topics/topic.schema";
import { topicService } from "@/modules/topics/topic.service";

export const POST = withErrorHandling(async (request: Request, context: RouteContext<"/api/subjects/[subjectId]/topics">) => { const { subjectId } = await context.params; return ok(await topicService.create(subjectIdSchema.parse(subjectId), await validatedBody(request, createTopicSchema)), { status: 201 }); });
