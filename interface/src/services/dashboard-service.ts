import { apiRequest } from "./api-client";
import type { DashboardDto } from "@/types/domain";
export const dashboardApi = { get: () => apiRequest<DashboardDto>("/api/dashboard") };
