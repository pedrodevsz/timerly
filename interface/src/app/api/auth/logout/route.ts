import { assertSameOrigin } from "@/lib/http/csrf";
import { noContent, withErrorHandling } from "@/lib/http/responses";
import { deleteCurrentSession } from "@/modules/auth/session.service";

export const dynamic = "force-dynamic";

export const POST = withErrorHandling(async (request: Request) => {
  assertSameOrigin(request);
  await deleteCurrentSession();
  return noContent({ headers: { "Cache-Control": "no-store" } });
});
