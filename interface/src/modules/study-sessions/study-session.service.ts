import { getPrisma } from "@/lib/db/prisma";
import { conflict, notFound } from "@/lib/errors/app-error";
import { runningDuration } from "@/lib/time/duration";
import type { StudySessionDto } from "@/types/domain";
import {
  studySessionRepository,
  sessionInclude,
} from "./study-session.repository";
import type {
  CreateStudySessionInput,
  UpdateStudySessionInput,
} from "./study-session.schema";

type SessionRecord = NonNullable<
  Awaited<ReturnType<typeof studySessionRepository.findById>>
>;

function dto(session: SessionRecord, now = new Date()): StudySessionDto {
  const elapsedSeconds =
    session.status === "ACTIVE"
      ? runningDuration(
          session.durationSeconds,
          session.lastResumedAt,
          now,
        )
      : session.durationSeconds;

  return {
    id: session.id,
    status: session.status,
    startedAt: session.startedAt.toISOString(),
    endedAt: session.endedAt?.toISOString() ?? null,
    durationSeconds: session.durationSeconds,
    elapsedSeconds,
    project: {
      id: session.topic.subject.project.id,
      name: session.topic.subject.project.name,
    },
    subject: {
      id: session.topic.subject.id,
      name: session.topic.subject.name,
    },
    topic: {
      id: session.topic.id,
      name: session.topic.name,
    },
  };
}

async function requireSession(userId: string, id: number) {
  const session = await studySessionRepository.findById(userId, id);
  if (!session)
    throw notFound("SESSION_NOT_FOUND", "Sessão não encontrada.");
  return session;
}

function requireOpen(session: SessionRecord) {
  if (session.status === "COMPLETED")
    throw conflict(
      "SESSION_ALREADY_COMPLETED",
      "Esta sessão já foi encerrada.",
    );
}

function transitionTimestamp(
  occurredAt: string | undefined,
  serverNow: Date,
  earliest: Date,
) {
  if (!occurredAt) return serverNow;
  const requested = new Date(occurredAt).getTime();
  return new Date(
    Math.min(serverNow.getTime(), Math.max(earliest.getTime(), requested)),
  );
}

function startTimestamp(occurredAt: string | undefined, serverNow: Date) {
  if (!occurredAt) return serverNow;
  const maximumLookback = serverNow.getTime() - 5 * 60_000;
  return new Date(
    Math.min(serverNow.getTime(), Math.max(maximumLookback, new Date(occurredAt).getTime())),
  );
}

export const studySessionService = {
  async list(userId: string) {
    return (await studySessionRepository.list(userId)).map((session) =>
      dto(session),
    );
  },
  async active(userId: string) {
    const session = await studySessionRepository.findActive(userId);
    return session ? dto(session) : null;
  },
  async create(userId: string, input: CreateStudySessionInput) {
    const now = new Date();
    const occurredAt = startTimestamp(input.occurredAt, now);
    const topic = await getPrisma().topic.findFirst({
      where: {
        id: input.topicId,
        subject: { project: { userId } },
      },
      select: { id: true },
    });
    if (!topic)
      throw notFound("TOPIC_NOT_FOUND", "Tópico não encontrado.");
    const activeSession = await studySessionRepository.findActive(userId);
    if (activeSession?.topic.id === input.topicId) {
      return dto(activeSession, now);
    }
    if (activeSession)
      throw conflict(
        "ACTIVE_SESSION_EXISTS",
        "Encerre a sessão atual antes de iniciar outra.",
      );
    return dto(
      await studySessionRepository.create(userId, input.topicId, occurredAt),
      now,
    );
  },
  async update(
    userId: string,
    id: number,
    input: UpdateStudySessionInput,
  ) {
    const session = await requireSession(userId, id);
    const now = new Date();
    if (input.action === "pause") {
      if (session.status === "PAUSED") return dto(session, now);
      requireOpen(session);
      if (session.status !== "ACTIVE")
        throw conflict(
          "SESSION_NOT_ACTIVE",
          "A sessão não está em andamento.",
        );
      const occurredAt = transitionTimestamp(
        input.occurredAt,
        now,
        session.lastTransitionAt,
      );
      return dto(
        await studySessionRepository.update(id, {
          status: "PAUSED",
          durationSeconds: runningDuration(
            session.durationSeconds,
            session.lastResumedAt,
            occurredAt,
          ),
          lastResumedAt: null,
          lastTransitionAt: occurredAt,
        }),
        now,
      );
    }
    if (input.action === "resume") {
      if (session.status === "ACTIVE") return dto(session, now);
      requireOpen(session);
      if (session.status !== "PAUSED")
        throw conflict(
          "SESSION_NOT_PAUSED",
          "A sessão não está pausada.",
        );
      const occurredAt = transitionTimestamp(
        input.occurredAt,
        now,
        session.lastTransitionAt,
      );
      return dto(
        await studySessionRepository.update(id, {
          status: "ACTIVE",
          lastResumedAt: occurredAt,
          lastTransitionAt: occurredAt,
        }),
        now,
      );
    }
    if (session.status === "COMPLETED") return dto(session, now);
    requireOpen(session);
    const occurredAt = transitionTimestamp(
      input.occurredAt,
      now,
      session.lastTransitionAt,
    );
    const durationSeconds =
      session.status === "ACTIVE"
        ? runningDuration(
            session.durationSeconds,
            session.lastResumedAt,
            occurredAt,
          )
        : session.durationSeconds;
    const completed = await getPrisma().$transaction(async (transaction) =>
      transaction.studySession.update({
        where: { id },
        data: {
          status: "COMPLETED",
          endedAt: occurredAt,
          durationSeconds,
          lastResumedAt: null,
          lastTransitionAt: occurredAt,
        },
        include: sessionInclude,
      }),
    );
    return dto(completed, now);
  },
};
