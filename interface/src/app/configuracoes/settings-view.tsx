"use client";

import { useCallback, useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import {
  AlertCircle,
  Bell,
  Check,
  Clock3,
  Globe2,
  Palette,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useResource } from "@/hooks/use-resource";
import { settingsApi } from "@/services/settings-service";
import type { UserSettingsDto } from "@/types/domain";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function Switch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      className={cn(
        "relative h-6 w-11 rounded-full border transition",
        checked
          ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]"
          : "border-[var(--border-strong)] bg-[var(--surface-3)]",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 size-4 rounded-full bg-white shadow transition",
          checked ? "left-[22px]" : "left-1",
        )}
      />
    </button>
  );
}
const tabs = [
  { value: "perfil", label: "Perfil", icon: UserRound },
  { value: "preferencias", label: "Preferências", icon: Palette },
  { value: "notificacoes", label: "Notificações", icon: Bell },
];

export function SettingsView() {
  const loader = useCallback(() => settingsApi.get(), []);
  const { data, setData, loading, error, reload } = useResource(loader);
  if (loading)
    return (
      <div className="page-shell max-w-5xl">
        <div className="h-12 w-64 animate-pulse rounded-lg bg-[var(--surface)]" />
        <div className="mt-10 h-96 animate-pulse rounded-xl bg-[var(--surface)]" />
      </div>
    );
  if (error || !data)
    return (
      <div className="page-shell max-w-5xl">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16">
            <AlertCircle className="size-6 text-[var(--danger)]" />
            <p className="text-sm">
              {error ?? "Não foi possível carregar as configurações."}
            </p>
            <Button variant="secondary" onClick={() => void reload()}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  return (
    <SettingsContent
      key={`${data.name}-${data.email}`}
      initial={data}
      onSaved={setData}
    />
  );
}

function SettingsContent({
  initial,
  onSaved,
}: {
  initial: UserSettingsDto;
  onSaved: React.Dispatch<React.SetStateAction<UserSettingsDto | null>>;
}) {
  const [form, setForm] = useState(initial);
  const [saved, setSaved] = useState(false);
  async function save(patch: Partial<UserSettingsDto>) {
    try {
      const updated = await settingsApi.update(patch);
      onSaved(updated);
      setForm(updated);
      setSaved(true);
      window.dispatchEvent(new Event("settings-updated"));
      window.setTimeout(() => setSaved(false), 1800);
    } catch (reason) {
      toast.error(
        reason instanceof Error ? reason.message : "Não foi possível salvar.",
      );
    }
  }
  return (
    <div className="page-shell max-w-5xl">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Sua conta</p>
          <h1>Configurações</h1>
          <p>Ajuste o app ao seu jeito de estudar.</p>
        </div>
      </header>
      <Tabs.Root
        defaultValue="perfil"
        className="grid gap-5 md:grid-cols-[200px_1fr]"
      >
        <Tabs.List className="flex gap-1 overflow-x-auto md:flex-col">
          {tabs.map((tab) => (
            <Tabs.Trigger
              key={tab.value}
              value={tab.value}
              className="flex min-w-max items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-[var(--muted-foreground)] transition hover:bg-[var(--surface-2)] data-[state=active]:bg-[var(--surface-2)] data-[state=active]:text-[var(--foreground)]"
            >
              <tab.icon className="size-4" />
              {tab.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <div>
          <Tabs.Content value="perfil">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Informações pessoais</CardTitle>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    Como você aparece no Orbe.
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-7 flex items-center gap-4">
                  <div className="grid size-16 place-items-center rounded-full bg-[var(--avatar)] font-display text-xl font-semibold">
                    {form.name
                      .split(" ")
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </div>
                  <div>
                    <Button size="sm" variant="secondary" disabled>
                      Alterar foto
                    </Button>
                    <p className="mt-2 text-[11px] text-[var(--muted-foreground)]">
                      Upload será habilitado com autenticação.
                    </p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2 text-xs font-medium">
                    <span>Nome</span>
                    <Input
                      value={form.name}
                      onChange={(event) =>
                        setForm({ ...form, name: event.target.value })
                      }
                    />
                  </label>
                  <label className="space-y-2 text-xs font-medium">
                    <span>E-mail</span>
                    <Input
                      value={form.email}
                      onChange={(event) =>
                        setForm({ ...form, email: event.target.value })
                      }
                      type="email"
                    />
                  </label>
                </div>
                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={() =>
                      void save({ name: form.name, email: form.email })
                    }
                  >
                    {saved ? (
                      <>
                        <Check className="size-4" /> Salvo
                      </>
                    ) : (
                      "Salvar alterações"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Tabs.Content>
          <Tabs.Content value="preferencias">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Preferências de estudo</CardTitle>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    Tempo, idioma e comportamento do cronômetro.
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <SettingRow
                  icon={Clock3}
                  title="Meta diária"
                  description="Tempo que você pretende estudar por dia"
                >
                  <select
                    value={form.dailyGoalMinutes}
                    onChange={(event) =>
                      void save({
                        dailyGoalMinutes: Number(event.target.value),
                      })
                    }
                    className="select-field"
                  >
                    <option value="60">1 hora</option>
                    <option value="120">2 horas</option>
                    <option value="180">3 horas</option>
                  </select>
                </SettingRow>
                <SettingRow
                  icon={Globe2}
                  title="Fuso horário"
                  description="Usado para calcular dias estudados e sequência"
                >
                  <select
                    value={form.timezone}
                    onChange={(event) =>
                      void save({ timezone: event.target.value })
                    }
                    className="select-field"
                  >
                    <option value="America/Sao_Paulo">São Paulo (GMT−3)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </SettingRow>
                <SettingRow
                  icon={Palette}
                  title="Sons do cronômetro"
                  description="Avisar ao pausar ou encerrar uma sessão"
                >
                  <Switch
                    checked={form.timerSounds}
                    onChange={() =>
                      void save({ timerSounds: !form.timerSounds })
                    }
                  />
                </SettingRow>
              </CardContent>
            </Card>
          </Tabs.Content>
          <Tabs.Content value="notificacoes">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Notificações</CardTitle>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    Lembretes gentis para manter seu ritmo.
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <SettingRow
                  icon={Bell}
                  title="Lembrete diário"
                  description="Receber um lembrete quando ainda não houver estudo no dia"
                >
                  <Switch
                    checked={form.dailyReminder}
                    onChange={() =>
                      void save({ dailyReminder: !form.dailyReminder })
                    }
                  />
                </SettingRow>
              </CardContent>
            </Card>
          </Tabs.Content>
        </div>
      </Tabs.Root>
    </div>
  );
}

function SettingRow({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Clock3;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-[var(--border)] py-4 last:border-0">
      <div className="grid size-9 place-items-center rounded-lg bg-[var(--surface-3)]">
        <Icon className="size-4 text-[var(--muted-foreground)]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
          {description}
        </p>
      </div>
      {children}
    </div>
  );
}
