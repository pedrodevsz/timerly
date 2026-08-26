import { ok, withErrorHandling } from "@/lib/http/responses";
import { getDashboard } from "@/modules/dashboard/dashboard.service";

export const dynamic = "force-dynamic";
export const GET = withErrorHandling(async () => ok(await getDashboard()));
