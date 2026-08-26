import { noContent, ok, validatedBody, withErrorHandling } from "@/lib/http/responses";
import { projectIdSchema, updateProjectSchema } from "@/modules/projects/project.schema";
import { projectService } from "@/modules/projects/project.service";

export const dynamic = "force-dynamic";
export const GET = withErrorHandling(async (_request: Request, context: RouteContext<"/api/projects/[projectId]">) => { const { projectId } = await context.params; return ok(await projectService.get(projectIdSchema.parse(projectId))); });
export const PATCH = withErrorHandling(async (request: Request, context: RouteContext<"/api/projects/[projectId]">) => { const { projectId } = await context.params; return ok(await projectService.update(projectIdSchema.parse(projectId), await validatedBody(request, updateProjectSchema))); });
export const DELETE = withErrorHandling(async (_request: Request, context: RouteContext<"/api/projects/[projectId]">) => { const { projectId } = await context.params; await projectService.delete(projectIdSchema.parse(projectId)); return noContent(); });
