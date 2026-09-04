import { apiRequest } from "./api-client";
import type {
  ManualStudyOptionsDto,
  ManualStudyResultDto,
  StudySessionDto,
} from "@/types/domain";
export const studySessionApi = {
  manualOptions: () =>
    apiRequest<ManualStudyOptionsDto>("/api/study-sessions/manual"),
  createManual: (input: {
    subjectId: string;
    topic: { type: "existing"; id: number } | { type: "new"; name: string };
    studyDate: string;
    durationSeconds: number;
  }) =>
    apiRequest<ManualStudyResultDto>("/api/study-sessions/manual", {
      method: "POST",
      body: JSON.stringify(input),
    }),
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
