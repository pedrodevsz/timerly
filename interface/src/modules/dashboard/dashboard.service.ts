import { calculateLongestStreak, calculateStreak, startOfLocalDay } from "@/lib/time/duration";
import type { DashboardDto, StudySessionDto } from "@/types/domain";
import { settingsService } from "@/modules/settings/settings.service";
import { dashboardRepository } from "./dashboard.repository";

function sessionDto(session: Awaited<ReturnType<typeof dashboardRepository.sessions>>[number]): StudySessionDto { return { id: session.id, status: session.status, startedAt: session.startedAt.toISOString(), endedAt: session.endedAt?.toISOString() ?? null, durationSeconds: session.durationSeconds, elapsedSeconds: session.durationSeconds, project: { id: session.topic.subject.project.id, name: session.topic.subject.project.name }, subject: { id: session.topic.subject.id, name: session.topic.subject.name }, topic: { id: session.topic.id, name: session.topic.name } }; }

export async function getDashboard(now = new Date()): Promise<DashboardDto> {
  const [sessions, settings] = await Promise.all([dashboardRepository.sessions(), settingsService.get()]);
  const timezone = settings.timezone;
  const todayKey = startOfLocalDay(now, timezone);
  const today = new Date(`${todayKey}T12:00:00Z`);
  const weekStart = new Date(today.getTime() - 6 * 86_400_000).toISOString().slice(0, 10);
  const month = todayKey.slice(0, 7);
  const dayKeys = sessions.map((session) => startOfLocalDay(session.startedAt, timezone));
  const durationByDay = new Map<string, number>();
  const durationBySubject = new Map<string, { id: string; name: string; durationSeconds: number }>();
  for (const session of sessions) {
    const key = startOfLocalDay(session.startedAt, timezone);
    durationByDay.set(key, (durationByDay.get(key) ?? 0) + session.durationSeconds);
    const subject = session.topic.subject;
    const current = durationBySubject.get(subject.id) ?? { id: subject.id, name: subject.name, durationSeconds: 0 };
    current.durationSeconds += session.durationSeconds; durationBySubject.set(subject.id, current);
  }
  const daily = Array.from({ length: 7 }, (_, index) => { const date = new Date(today.getTime() - (6 - index) * 86_400_000).toISOString().slice(0, 10); return { date, durationSeconds: durationByDay.get(date) ?? 0 }; });
  const streakAnchor = dayKeys.includes(todayKey) ? todayKey : new Date(today.getTime() - 86_400_000).toISOString().slice(0, 10);
  return {
    studiedDaysThisMonth: new Set(dayKeys.filter((key) => key.startsWith(month))).size,
    weeklySeconds: daily.reduce((sum, item) => sum + item.durationSeconds, 0),
    currentStreak: calculateStreak(dayKeys, streakAnchor),
    longestStreak: calculateLongestStreak(dayKeys),
    subjects: [...durationBySubject.values()].filter((item) => sessions.some((session) => startOfLocalDay(session.startedAt, timezone) >= weekStart && session.topic.subject.id === item.id)).map((item) => ({ ...item, durationSeconds: sessions.filter((session) => startOfLocalDay(session.startedAt, timezone) >= weekStart && session.topic.subject.id === item.id).reduce((sum, session) => sum + session.durationSeconds, 0) })).sort((a, b) => b.durationSeconds - a.durationSeconds),
    daily,
    recentSessions: sessions.slice(0, 8).map(sessionDto),
  };
}
