import { apiRequest } from "./api-client";
import type { ProjectDetailDto, ProjectSummaryDto, SubjectDto, TopicDto } from "@/types/domain";

export const projectApi = {
  list: () => apiRequest<ProjectSummaryDto[]>("/api/projects"),
  get: (id: string) => apiRequest<ProjectDetailDto>(`/api/projects/${id}`),
  create: (input: { name: string; description: string }) => apiRequest<ProjectDetailDto>("/api/projects", { method: "POST", body: JSON.stringify(input) }),
  update: (id: string, input: { name?: string; description?: string }) => apiRequest<ProjectDetailDto>(`/api/projects/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  delete: (id: string) => apiRequest<void>(`/api/projects/${id}`, { method: "DELETE" }),
  createSubject: (projectId: string, name: string) => apiRequest<SubjectDto>(`/api/projects/${projectId}/subjects`, { method: "POST", body: JSON.stringify({ name }) }),
  updateSubject: (subjectId: string, name: string) => apiRequest<SubjectDto>(`/api/subjects/${subjectId}`, { method: "PATCH", body: JSON.stringify({ name }) }),
  deleteSubject: (subjectId: string) => apiRequest<void>(`/api/subjects/${subjectId}`, { method: "DELETE" }),
  createTopic: (subjectId: string, name: string) => apiRequest<TopicDto>(`/api/subjects/${subjectId}/topics`, { method: "POST", body: JSON.stringify({ name }) }),
  updateTopic: (topicId: number, input: { name?: string; completed?: boolean }) => apiRequest<TopicDto>(`/api/topics/${topicId}`, { method: "PATCH", body: JSON.stringify(input) }),
  deleteTopic: (topicId: number) => apiRequest<void>(`/api/topics/${topicId}`, { method: "DELETE" }),
};
