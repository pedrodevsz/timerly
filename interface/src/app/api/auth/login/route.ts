import { assertSameOrigin } from "@/lib/http/csrf";
import { ok, validatedBody, withErrorHandling } from "@/lib/http/responses";
import { enforceRateLimit } from "@/lib/rate-limit/rate-limiter";
import { loginSchema } from "@/modules/auth/auth.schema";
import { authService } from "@/modules/auth/auth.service";

export const dynamic = "force-dynamic";

export const POST = withErrorHandling(async (request: Request) => {
  assertSameOrigin(request);
  await enforceRateLimit(request, "login");
  const user = await authService.login(await validatedBody(request, loginSchema));
  return ok({ user }, { headers: { "Cache-Control": "no-store" } });
});
