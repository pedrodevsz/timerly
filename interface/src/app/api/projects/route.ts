import { ok, validatedBody, withErrorHandling } from "@/lib/http/responses";
import { createProjectSchema } from "@/modules/projects/project.schema";
import { projectService } from "@/modules/projects/project.service";

export const dynamic = "force-dynamic";
export const GET = withErrorHandling(async () => ok(await projectService.list()));
export const POST = withErrorHandling(async (request: Request) => ok(await projectService.create(await validatedBody(request, createProjectSchema)), { status: 201 }));
