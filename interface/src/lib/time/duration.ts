export function runningDuration(durationSeconds: number, lastResumedAt: Date | null, now = new Date()) {
  if (!lastResumedAt) return durationSeconds;
  return durationSeconds + Math.max(0, Math.floor((now.getTime() - lastResumedAt.getTime()) / 1000));
}

export function startOfLocalDay(date: Date, timezone: string) {
  const local = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  return local;
}

export function calculateStreak(dayKeys: string[], todayKey: string) {
  const studied = new Set(dayKeys);
  let cursor = new Date(`${todayKey}T12:00:00Z`);
  let streak = 0;
  while (studied.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor = new Date(cursor.getTime() - 86_400_000);
  }
  return streak;
}

export function calculateLongestStreak(dayKeys: string[]) {
  const sorted = [...new Set(dayKeys)].sort();
  let longest = 0; let current = 0; let previous: Date | null = null;
  for (const key of sorted) {
    const date = new Date(`${key}T12:00:00Z`);
    current = previous && date.getTime() - previous.getTime() === 86_400_000 ? current + 1 : 1;
    longest = Math.max(longest, current); previous = date;
  }
  return longest;
}
