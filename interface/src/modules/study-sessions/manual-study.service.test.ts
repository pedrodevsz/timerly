import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ transaction: vi.fn() }));

vi.mock("@/lib/db/prisma", () => ({
  getPrisma: () => ({ $transaction: mocks.transaction }),
}));

import { studySessionService } from "./study-session.service";

const userId = "00000000-0000-4000-8000-000000000001";
const subjectId = "00000000-0000-4000-8000-000000000010";

function session(topicId: number, topicName: string) {
  return {
    id: 30,
    userId,
    topicId,
    startedAt: new Date("2026-09-01T12:00:00.000Z"),
    lastResumedAt: null,
    lastTransitionAt: new Date("2026-09-01T13:30:00.000Z"),
    endedAt: new Date("2026-09-01T13:30:00.000Z"),
    durationSeconds: 5_400,
    status: "COMPLETED" as const,
    topic: {
      id: topicId,
      name: topicName,
      completed: false,
      subjectId,
      subject: {
        id: subjectId,
        name: "Matemática",
        projectId: "00000000-0000-4000-8000-000000000020",
        createdAt: new Date(),
        updatedAt: new Date(),
        project: {
          id: "00000000-0000-4000-8000-000000000020",
          name: "ENEM",
          description: "",
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    },
  };
}

function transaction(overrides?: {
  subject?: { id: string } | null;
  existingTopic?: { id: number } | null;
  topics?: Array<{ id: number; name: string }>;
  createdTopic?: { id: number | null };
}) {
  const createdTopic = overrides?.createdTopic ?? { id: 12 };
  const tx = {
    $executeRaw: vi.fn().mockResolvedValue(0),
    subject: {
      findFirst: vi.fn().mockResolvedValue(
        overrides && "subject" in overrides ? overrides.subject : { id: subjectId },
      ),
    },
    topic: {
      findFirst: vi.fn().mockResolvedValue(
        overrides && "existingTopic" in overrides
          ? overrides.existingTopic
          : { id: 7 },
      ),
      findMany: vi.fn().mockResolvedValue(overrides?.topics ?? []),
      create: vi.fn().mockResolvedValue(createdTopic),
    },
    studySession: {
      create: vi.fn().mockImplementation(({ data }) =>
        Promise.resolve(session(data.topicId, data.topicId === 7 ? "Funções" : "Álgebra")),
      ),
    },
  };
  mocks.transaction.mockImplementation((callback) => callback(tx));
  return tx;
}

describe("registro manual de estudo", () => {
  beforeEach(() => vi.clearAllMocks());

  it("cria uma sessão concluída no tópico existente da matéria", async () => {
    const tx = transaction();

    const result = await studySessionService.createManual(userId, {
      subjectId,
      topic: { type: "existing", id: 7 },
      studyDate: "2026-09-01",
      durationSeconds: 5_400,
    });

    expect(tx.subject.findFirst).toHaveBeenCalledWith({
      where: { id: subjectId, project: { userId } },
      select: { id: true },
    });
    expect(tx.topic.findFirst).toHaveBeenCalledWith({
      where: { id: 7, subjectId },
      select: { id: true },
    });
    expect(tx.studySession.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId,
          topicId: 7,
          status: "COMPLETED",
          durationSeconds: 5_400,
          lastResumedAt: null,
          lastTransitionAt: new Date("2026-09-01T13:30:00.000Z"),
        }),
      }),
    );
    expect(result).toMatchObject({ topicCreated: false, session: { status: "COMPLETED" } });
  });

  it("rejeita matéria que não pertence ao usuário", async () => {
    const tx = transaction({ subject: null });

    await expect(
      studySessionService.createManual(userId, {
        subjectId,
        topic: { type: "existing", id: 7 },
        studyDate: "2026-09-01",
        durationSeconds: 1_800,
      }),
    ).rejects.toMatchObject({ code: "SUBJECT_NOT_FOUND", status: 404 });
    expect(tx.studySession.create).not.toHaveBeenCalled();
  });

  it("rejeita tópico de outra matéria", async () => {
    const tx = transaction({ existingTopic: null });

    await expect(
      studySessionService.createManual(userId, {
        subjectId,
        topic: { type: "existing", id: 99 },
        studyDate: "2026-09-01",
        durationSeconds: 1_800,
      }),
    ).rejects.toMatchObject({ code: "TOPIC_NOT_FOUND", status: 404 });
    expect(tx.studySession.create).not.toHaveBeenCalled();
  });

  it("reutiliza tópico equivalente sem duplicar por maiúsculas", async () => {
    const tx = transaction({ topics: [{ id: 7, name: "SQL" }] });

    const result = await studySessionService.createManual(userId, {
      subjectId,
      topic: { type: "new", name: "  sql  " },
      studyDate: "2026-09-01",
      durationSeconds: 1_800,
    });

    expect(tx.$executeRaw).toHaveBeenCalledOnce();
    expect(tx.$executeRaw.mock.invocationCallOrder[0]).toBeLessThan(
      tx.topic.findMany.mock.invocationCallOrder[0],
    );
    expect(tx.topic.create).not.toHaveBeenCalled();
    expect(tx.studySession.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ topicId: 7 }) }),
    );
    expect(result.topicCreated).toBe(false);
  });

  it("cria tópico novo somente dentro da confirmação transacional", async () => {
    const tx = transaction({ topics: [] });

    const result = await studySessionService.createManual(userId, {
      subjectId,
      topic: { type: "new", name: "  Álgebra   linear " },
      studyDate: "2026-09-01",
      durationSeconds: 1_800,
    });

    expect(tx.topic.create).toHaveBeenCalledWith({
      data: { subjectId, name: "Álgebra linear" },
      select: { id: true },
    });
    expect(tx.studySession.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ topicId: 12 }) }),
    );
    expect(result.topicCreated).toBe(true);
  });

  it("falha antes da transação quando não existe usuário autenticado", async () => {
    await expect(
      studySessionService.createManual("", {
        subjectId,
        topic: { type: "existing", id: 7 },
        studyDate: "2026-09-01",
        durationSeconds: 1_800,
      }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED", status: 401 });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("não tenta criar a sessão quando o novo tópico não retorna ID válido", async () => {
    const tx = transaction({ topics: [], createdTopic: { id: null } });

    await expect(
      studySessionService.createManual(userId, {
        subjectId,
        topic: { type: "new", name: "Geometria" },
        studyDate: "2026-09-01",
        durationSeconds: 1_800,
      }),
    ).rejects.toMatchObject({
      code: "INVALID_TOPIC_REFERENCE",
      status: 500,
    });
    expect(tx.studySession.create).not.toHaveBeenCalled();
  });

  it("propaga a falha da sessão para a transaction reverter o tópico novo", async () => {
    const tx = transaction({ topics: [] });
    tx.studySession.create.mockRejectedValueOnce(
      new Error("falha ao inserir sessão"),
    );

    await expect(
      studySessionService.createManual(userId, {
        subjectId,
        topic: { type: "new", name: "Geometria" },
        studyDate: "2026-09-01",
        durationSeconds: 1_800,
      }),
    ).rejects.toThrow("falha ao inserir sessão");
    expect(mocks.transaction).toHaveBeenCalledOnce();
    expect(tx.topic.create).toHaveBeenCalledOnce();
  });
});
