export type TopicDto = {
  id: number;
  name: string;
  completed: boolean;
  subjectId: string;
};

export type SubjectDto = {
  id: string;
  name: string;
  projectId: string;
  progress: number;
  topics: TopicDto[];
};

export type ProjectSummaryDto = {
  id: string;
  name: string;
  description: string;
  progress: number;
  subjectCount: number;
  topicCount: number;
  studiedSeconds: number;
  updatedAt: string;
};

export type ProjectDetailDto = ProjectSummaryDto & { subjects: SubjectDto[] };

export type StudySessionStatus = "ACTIVE" | "PAUSED" | "COMPLETED";

export type StudySessionDto = {
  id: number;
  status: StudySessionStatus;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number;
  elapsedSeconds: number;
  project: { id: string; name: string };
  subject: { id: string; name: string };
  topic: { id: number; name: string };
};

export type DashboardDto = {
  studiedDaysThisMonth: number;
  weeklySeconds: number;
  currentStreak: number;
  longestStreak: number;
  subjects: Array<{ id: string; name: string; durationSeconds: number }>;
  daily: Array<{ date: string; durationSeconds: number }>;
  recentSessions: StudySessionDto[];
};

export type UserSettingsDto = {
  name: string;
  email: string;
  dailyGoalMinutes: number;
  timezone: string;
  timerSounds: boolean;
  dailyReminder: boolean;
};

export type ApiSuccess<T> = { data: T };
export type ApiFailure = { error: { code: string; message: string; details?: Record<string, string[]> } };
