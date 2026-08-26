import { apiRequest } from "./api-client";
import type { UserSettingsDto } from "@/types/domain";
export const settingsApi = { get: () => apiRequest<UserSettingsDto>("/api/settings"), update: (input: Partial<UserSettingsDto>) => apiRequest<UserSettingsDto>("/api/settings", { method: "PATCH", body: JSON.stringify(input) }) };
