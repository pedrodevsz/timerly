import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  topicFindFirst: vi.fn(),
  findActive: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  getPrisma: () => ({
    topic: { findFirst: mocks.topicFindFirst },
  }),
}));
vi.mock("./study-session.repository", () => ({
  sessionInclude: {},
  studySessionRepository: {
    findActive: mocks.findActive,
    findById: mocks.findById,
    create: mocks.create,
    update: mocks.update,
  },
}));

import { studySessionService } from "./study-session.service";

const activeSession = {
  id: 41,
  userId: "user-a",
  topicId: 17,
  status: "ACTIVE" as const,
  startedAt: new Date("2026-09-02T10:00:00.000Z"),
  lastResumedAt: new Date("2026-09-02T10:00:00.000Z"),
  lastTransitionAt: new Date("2026-09-02T10:00:00.000Z"),
  endedAt: null,
  durationSeconds: 0,
  createdAt: new Date("2026-09-02T10:00:00.000Z"),
  topic: {
    id: 17,
    name: "Funções quadráticas",
    completed: false,
    subjectId: "subject-a",
    subject: {
      id: "subject-a",
      name: "Matemática",
      projectId: "project-a",
      createdAt: new Date("2026-09-01T10:00:00.000Z"),
      updatedAt: new Date("2026-09-01T10:00:00.000Z"),
      project: {
        id: "project-a",
        name: "ENEM 2027",
        description: "",
        userId: "user-a",
        createdAt: new Date("2026-09-01T10:00:00.000Z"),
        updatedAt: new Date("2026-09-01T10:00:00.000Z"),
      },
    },
  },
};

describe("transições da sessão de estudo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-02T10:00:14.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("usa o timestamp do clique ao pausar, sem incluir a latência", async () => {
    mocks.findById.mockResolvedValue(activeSession);
    mocks.update.mockResolvedValue({
      ...activeSession,
      status: "PAUSED",
      lastResumedAt: null,
      lastTransitionAt: new Date("2026-09-02T10:00:10.000Z"),
      durationSeconds: 10,
    });

    const result = await studySessionService.update("user-a", 41, {
      action: "pause",
      occurredAt: "2026-09-02T10:00:10.000Z",
    });

    expect(mocks.update).toHaveBeenCalledWith(41, {
      status: "PAUSED",
      durationSeconds: 10,
      lastResumedAt: null,
      lastTransitionAt: new Date("2026-09-02T10:00:10.000Z"),
    });
    expect(result.elapsedSeconds).toBe(10);
  });

  it("considera uma pausa repetida como sucesso idempotente", async () => {
    mocks.findById.mockResolvedValue({
      ...activeSession,
      status: "PAUSED",
      lastResumedAt: null,
      durationSeconds: 10,
    });

    await expect(
      studySessionService.update("user-a", 41, {
        action: "pause",
        occurredAt: "2026-09-02T10:00:10.000Z",
      }),
    ).resolves.toMatchObject({ status: "PAUSED", elapsedSeconds: 10 });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("reutiliza a sessão do mesmo tópico em um retry de start", async () => {
    mocks.topicFindFirst.mockResolvedValue({ id: 17 });
    mocks.findActive.mockResolvedValue(activeSession);

    await expect(
      studySessionService.create("user-a", {
        topicId: 17,
        occurredAt: "2026-09-02T10:00:00.000Z",
      }),
    ).resolves.toMatchObject({ id: 41, topic: { id: 17 } });
    expect(mocks.create).not.toHaveBeenCalled();
  });
});
