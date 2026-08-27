import { ok, withErrorHandling } from "@/lib/http/responses";
import { getDashboard } from "@/modules/dashboard/dashboard.service";
import { requireUser } from "@/lib/auth/require-user";

export const dynamic = "force-dynamic";
export const GET = withErrorHandling(async () => {
  const user = await requireUser();

  return ok(await getDashboard(user.id));
});
