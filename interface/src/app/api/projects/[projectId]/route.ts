import { noContent, ok, validatedBody, withErrorHandling } from "@/lib/http/responses";
import { projectIdSchema, updateProjectSchema } from "@/modules/projects/project.schema";
import { projectService } from "@/modules/projects/project.service";
import { requireUser } from "@/lib/auth/require-user";
import { assertSameOrigin } from "@/lib/http/csrf";

export const dynamic = "force-dynamic";
export const GET = withErrorHandling(
  async (
    _request: Request,
    context: RouteContext<"/api/projects/[projectId]">,
  ) => {
    const user = await requireUser();
    const { projectId } = await context.params;

    return ok(
      await projectService.get(user.id, projectIdSchema.parse(projectId)),
    );
  },
);

export const PATCH = withErrorHandling(
  async (
    request: Request,
    context: RouteContext<"/api/projects/[projectId]">,
  ) => {
    assertSameOrigin(request);

    const user = await requireUser();
    const { projectId } = await context.params;

    return ok(
      await projectService.update(
        user.id,
        projectIdSchema.parse(projectId),
        await validatedBody(request, updateProjectSchema),
      ),
    );
  },
);

export const DELETE = withErrorHandling(
  async (
    request: Request,
    context: RouteContext<"/api/projects/[projectId]">,
  ) => {
    assertSameOrigin(request);

    const user = await requireUser();
    const { projectId } = await context.params;

    await projectService.delete(user.id, projectIdSchema.parse(projectId));

    return noContent();
  },
);
