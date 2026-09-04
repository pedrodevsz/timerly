import { apiRequest } from "./api-client";
import type { StudySessionDto } from "@/types/domain";
export const studySessionApi = {
  active: () => apiRequest<StudySessionDto | null>("/api/study-sessions/active"),
  start: (topicId: number, occurredAt: string) =>
    apiRequest<StudySessionDto>("/api/study-sessions", {
      method: "POST",
      body: JSON.stringify({ topicId, occurredAt }),
    }),
  action: (
    id: number,
    action: "pause" | "resume" | "stop",
    occurredAt: string,
  ) =>
    apiRequest<StudySessionDto>(`/api/study-sessions/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ action, occurredAt }),
    }),
};
