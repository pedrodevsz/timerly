import { apiRequest } from "./api-client";
import type { StudySessionDto } from "@/types/domain";
export const studySessionApi = {
  active: () => apiRequest<StudySessionDto | null>("/api/study-sessions/active"),
  start: (topicId: number) => apiRequest<StudySessionDto>("/api/study-sessions", { method: "POST", body: JSON.stringify({ topicId }) }),
  action: (id: number, action: "pause" | "resume" | "stop") => apiRequest<StudySessionDto>(`/api/study-sessions/${id}`, { method: "PATCH", body: JSON.stringify({ action }) }),
  changeTopic: (id: number, topicId: number) => apiRequest<StudySessionDto>(`/api/study-sessions/${id}`, { method: "PATCH", body: JSON.stringify({ action: "change-topic", topicId }) }),
};
