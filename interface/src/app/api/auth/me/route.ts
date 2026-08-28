import { requireUser } from "@/lib/auth/require-user";
import { ok, withErrorHandling } from "@/lib/http/responses";

export const dynamic = "force-dynamic";

export const GET = withErrorHandling(async () => {
  const user = await requireUser();
  return ok({ user }, { headers: { "Cache-Control": "private, no-store" } });
});
