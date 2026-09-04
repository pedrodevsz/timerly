"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  BookMarked,
  CalendarDays,
  Clock3,
  Flame,
  Plus,
} from "lucide-react";
import { ManualStudyDialog } from "@/components/study-sessions/manual-study-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useResource } from "@/hooks/use-resource";
import { dashboardApi } from "@/services/dashboard-service";

const colors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
];
function hours(seconds: number) {
  return (seconds / 3600).toLocaleString("pt-BR", { maximumFractionDigits: 1 });
}
function duration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h ? `${h}h ${m}min` : `${m}min`;
}
function when(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default function Home() {
  const [manualStudyOpen, setManualStudyOpen] = useState(false);
  const loader = useCallback(() => dashboardApi.get(), []);
  const { data, loading, error, reload } = useResource(loader);
  useEffect(() => {
    const refresh = () => void reload();
    window.addEventListener("study-data-updated", refresh);
    return () => window.removeEventListener("study-data-updated", refresh);
  }, [reload]);
  if (loading)
    return (
      <div className="page-shell">
        <div className="h-20 w-80 animate-pulse rounded-xl bg-(--surface)" />
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-44 animate-pulse rounded-xl bg-(--surface)"
            />
          ))}
        </div>
      </div>
    );
  if (error || !data)
    return (
      <div className="page-shell">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16">
            <AlertCircle className="size-6 text-(--danger)" />
            <p className="text-sm">
              {error ?? "Não foi possível carregar o dashboard."}
            </p>
            <Button variant="secondary" onClick={() => void reload()}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  const maxSubject = Math.max(
    ...data.subjects.map((item) => item.durationSeconds),
    1,
  );
  const maxDay = Math.max(...data.daily.map((item) => item.durationSeconds), 1);
  const metrics = [
    {
      label: "Dias estudados",
      value: String(data.studiedDaysThisMonth),
      suffix: "este mês",
      detail: "dias com sessões concluídas",
      icon: CalendarDays,
    },
    {
      label: "Horas na semana",
      value: hours(data.weeklySeconds),
      suffix: "horas",
      detail: "últimos sete dias",
      icon: Clock3,
    },
    {
      label: "Sequência atual",
      value: String(data.currentStreak),
      suffix: "dias",
      detail: `Seu recorde é ${data.longestStreak} dias`,
      icon: Flame,
    },
  ];
  return (
    <div className="page-shell">
      <header className="page-heading">
        <div>
          <p className="eyebrow">
            {new Intl.DateTimeFormat("pt-BR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            }).format(new Date())}
          </p>
          <h1>Bom dia, Pedro.</h1>
          <p>O ritmo está bom. Mantenha a constância, não a pressa.</p>
        </div>
        <Button type="button" onClick={() => setManualStudyOpen(true)}>
          <Plus className="size-4" />
          Adicionar estudo manualmente
        </Button>
      </header>
      <section className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        {metrics.map((metric, index) => (
          <Card
            key={metric.label}
            className="metric-card group relative overflow-hidden"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-(--metric-line) to-transparent opacity-0 transition group-hover:opacity-100" />
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center justify-between text-xs text-(--muted-foreground)">
                <span>{metric.label}</span>
                <metric.icon className={`size-4 metric-icon-${index + 1}`} />
              </div>
              <div className="mt-7 flex items-end gap-2">
                <strong className="font-display text-5xl font-semibold leading-none tracking-[-.06em] sm:text-[3.35rem]">
                  {metric.value}
                </strong>
                <span className="mb-1 text-xs text-(--muted-foreground)">
                  {metric.suffix}
                </span>
              </div>
              <p className="mt-4 flex items-center gap-1 text-[11px] text-(--muted-foreground)">
                <ArrowUpRight className="size-3 text-(--positive)" />
                {metric.detail}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>
      <section className="mt-4 grid gap-4 lg:grid-cols-[1.35fr_.8fr]">
        <Card className="min-h-97.5">
          <CardHeader>
            <div>
              <CardTitle>Horas por matéria</CardTitle>
              <p className="mt-1 text-xs text-(--muted-foreground)">
                Distribuição nos últimos 7 dias
              </p>
            </div>
            <Badge>{hours(data.weeklySeconds)}h total</Badge>
          </CardHeader>
          <CardContent>
            {data.subjects.length === 0 ? (
              <div className="grid h-64 place-items-center text-sm text-(--muted-foreground)">
                Conclua uma sessão para ver o gráfico.
              </div>
            ) : (
              <div className="chart-grid mt-3">
                <div className="chart-bars">
                  {data.subjects.slice(0, 6).map((subject, index) => (
                    <div
                      key={subject.id}
                      className="group flex h-full flex-1 flex-col items-center justify-end gap-3"
                    >
                      <span className="translate-y-2 text-xs font-semibold opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
                        {hours(subject.durationSeconds)}h
                      </span>
                      <div
                        className="relative w-full max-w-16 overflow-hidden rounded-t-md bg-(--surface-3)"
                        style={{
                          height: `${(subject.durationSeconds / maxSubject) * 82}%`,
                        }}
                      >
                        <div
                          className="absolute inset-0 opacity-80 transition group-hover:opacity-100"
                          style={{ background: colors[index % colors.length] }}
                        />
                      </div>
                      <span className="max-w-full truncate text-[10px] text-(--muted-foreground) sm:text-xs">
                        {subject.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Ritmo semanal</CardTitle>
              <p className="mt-1 text-xs text-(--muted-foreground)">
                Consistência de estudo
              </p>
            </div>
            <BookMarked className="size-4 text-(--accent-secondary)" />
          </CardHeader>
          <CardContent>
            <div className="flex h-44 items-end justify-between gap-2">
              {data.daily.map((day) => (
                <div
                  key={day.date}
                  className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                >
                  <div
                    className="w-full rounded-sm bg-(--accent-secondary-muted) p-0.5"
                    style={{
                      height: `${Math.max((day.durationSeconds / maxDay) * 100, 3)}%`,
                    }}
                  >
                    <div className="h-full w-full rounded-xs bg-(--accent-secondary) opacity-60" />
                  </div>
                  <span className="text-[10px] text-(--muted-foreground)">
                    {new Intl.DateTimeFormat("pt-BR", {
                      weekday: "narrow",
                      timeZone: "UTC",
                    }).format(new Date(`${day.date}T12:00:00Z`))}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-lg border border-(--border) bg-(--surface-2) p-3">
              <p className="text-xs text-(--muted-foreground)">
                Melhor dia da semana
              </p>
              <div className="mt-1 flex items-baseline justify-between">
                <strong className="font-display text-lg">
                  {new Intl.DateTimeFormat("pt-BR", {
                    weekday: "long",
                    timeZone: "UTC",
                  }).format(
                    new Date(
                      `${data.daily.reduce((best, item) => (item.durationSeconds > best.durationSeconds ? item : best), data.daily[0]).date}T12:00:00Z`,
                    ),
                  )}
                </strong>
                <span className="text-xs text-(--accent-secondary)">
                  {duration(
                    Math.max(...data.daily.map((item) => item.durationSeconds)),
                  )}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
      <section className="mt-4">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Sessões recentes</CardTitle>
              <p className="mt-1 text-xs text-(--muted-foreground)">
                Seu histórico mais recente
              </p>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {data.recentSessions.length === 0 ? (
              <p className="py-10 text-center text-sm text-(--muted-foreground)">
                Nenhuma sessão concluída ainda.
              </p>
            ) : (
              <div className="divide-y divide-(--border)">
                {data.recentSessions.map((session, index) => (
                  <div
                    key={session.id}
                    className="group grid grid-cols-[auto_1fr_auto] items-center gap-3 py-3.5 sm:grid-cols-[auto_1fr_auto_auto] sm:gap-5"
                  >
                    <span
                      className="size-2 rounded-full shadow-[0_0_12px_currentColor]"
                      style={{
                        background: colors[index % colors.length],
                        color: colors[index % colors.length],
                      }}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {session.topic.name}
                      </p>
                      <p className="mt-0.5 text-xs text-(--muted-foreground)">
                        {session.subject.name}
                      </p>
                    </div>
                    <span className="hidden text-xs text-(--muted-foreground) sm:block">
                      {when(session.startedAt)}
                    </span>
                    <span className="font-display text-sm font-semibold tabular-nums">
                      {duration(session.elapsedSeconds)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
      <ManualStudyDialog
        open={manualStudyOpen}
        onOpenChange={setManualStudyOpen}
      />
    </div>
  );
}
