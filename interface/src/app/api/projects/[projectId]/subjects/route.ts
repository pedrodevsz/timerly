import { ok, validatedBody, withErrorHandling } from "@/lib/http/responses";
import { projectIdSchema } from "@/modules/projects/project.schema";
import { createSubjectSchema } from "@/modules/subjects/subject.schema";
import { subjectService } from "@/modules/subjects/subject.service";

export const POST = withErrorHandling(async (request: Request, context: RouteContext<"/api/projects/[projectId]/subjects">) => { const { projectId } = await context.params; return ok(await subjectService.create(projectIdSchema.parse(projectId), await validatedBody(request, createSubjectSchema)), { status: 201 }); });
