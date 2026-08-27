import { assertSameOrigin } from "@/lib/http/csrf";
import { ok, validatedBody, withErrorHandling } from "@/lib/http/responses";
import { enforceRateLimit } from "@/lib/rate-limit/rate-limiter";
import { registerSchema } from "@/modules/auth/auth.schema";
import { authService } from "@/modules/auth/auth.service";

export const dynamic = "force-dynamic";

export const POST = withErrorHandling(async (request: Request) => {
  assertSameOrigin(request);
  await enforceRateLimit(request, "register");
  const user = await authService.register(
    await validatedBody(request, registerSchema),
  );
  return ok(
    { user },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
});
