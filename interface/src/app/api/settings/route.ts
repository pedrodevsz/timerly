import { ok, validatedBody, withErrorHandling } from "@/lib/http/responses";
import { updateSettingsSchema } from "@/modules/settings/settings.schema";
import { settingsService } from "@/modules/settings/settings.service";

export const dynamic = "force-dynamic";
export const GET = withErrorHandling(async () => ok(await settingsService.get()));
export const PATCH = withErrorHandling(async (request: Request) => ok(await settingsService.update(await validatedBody(request, updateSettingsSchema))));
