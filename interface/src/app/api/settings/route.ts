import { ok, validatedBody, withErrorHandling } from "@/lib/http/responses";
import { updateSettingsSchema } from "@/modules/settings/settings.schema";
import { settingsService } from "@/modules/settings/settings.service";
import { requireUser } from "@/lib/auth/require-user";
import { assertSameOrigin } from "@/lib/http/csrf";

export const dynamic = "force-dynamic";
export const GET = withErrorHandling(async () => {
  const user = await requireUser();

  return ok(await settingsService.get(user.id));
});

export const PATCH = withErrorHandling(async (request: Request) => {
  assertSameOrigin(request);

  const user = await requireUser();

  return ok(
    await settingsService.update(
      user.id,
      await validatedBody(request, updateSettingsSchema),
    ),
  );
});
