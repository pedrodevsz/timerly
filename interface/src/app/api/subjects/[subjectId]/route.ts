import { noContent, ok, validatedBody, withErrorHandling } from "@/lib/http/responses";
import { subjectIdSchema, updateSubjectSchema } from "@/modules/subjects/subject.schema";
import { subjectService } from "@/modules/subjects/subject.service";

export const PATCH = withErrorHandling(async (request: Request, context: RouteContext<"/api/subjects/[subjectId]">) => { const { subjectId } = await context.params; return ok(await subjectService.update(subjectIdSchema.parse(subjectId), await validatedBody(request, updateSubjectSchema))); });
export const DELETE = withErrorHandling(async (_request: Request, context: RouteContext<"/api/subjects/[subjectId]">) => { const { subjectId } = await context.params; await subjectService.delete(subjectIdSchema.parse(subjectId)); return noContent(); });
