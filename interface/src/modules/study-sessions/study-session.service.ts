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
    const topic = await getPrisma().topic.findFirst({
      where: {
        id: input.topicId,
        subject: { project: { userId } },
      },
      select: { id: true },
    });
    if (!topic)
      throw notFound("TOPIC_NOT_FOUND", "Tópico não encontrado.");
    if (await studySessionRepository.findActive(userId))
      throw conflict(
        "ACTIVE_SESSION_EXISTS",
        "Encerre a sessão atual antes de iniciar outra.",
      );
    return dto(
      await studySessionRepository.create(userId, input.topicId, new Date()),
    );
  },
  async update(
    userId: string,
    id: number,
    input: UpdateStudySessionInput,
  ) {
    const session = await requireSession(userId, id);
    requireOpen(session);
    const now = new Date();
    if (input.action === "pause") {
      if (session.status !== "ACTIVE")
        throw conflict(
          "SESSION_NOT_ACTIVE",
          "A sessão não está em andamento.",
        );
      return dto(
        await studySessionRepository.update(id, {
          status: "PAUSED",
          durationSeconds: runningDuration(
            session.durationSeconds,
            session.lastResumedAt,
            now,
          ),
          lastResumedAt: null,
        }),
        now,
      );
    }
    if (input.action === "resume") {
      if (session.status !== "PAUSED")
        throw conflict(
          "SESSION_NOT_PAUSED",
          "A sessão não está pausada.",
        );
      return dto(
        await studySessionRepository.update(id, {
          status: "ACTIVE",
          lastResumedAt: now,
        }),
        now,
      );
    }
    if (input.action === "change-topic") {
      if (
        !(await getPrisma().topic.findFirst({
          where: {
            id: input.topicId,
            subject: { project: { userId } },
          },
          select: { id: true },
        }))
      )
        throw notFound("TOPIC_NOT_FOUND", "Tópico não encontrado.");
      return dto(
        await studySessionRepository.update(id, {
          topic: { connect: { id: input.topicId } },
        }),
        now,
      );
    }
    const durationSeconds =
      session.status === "ACTIVE"
        ? runningDuration(
            session.durationSeconds,
            session.lastResumedAt,
            now,
          )
        : session.durationSeconds;
    const completed = await getPrisma().$transaction(async (transaction) =>
      transaction.studySession.update({
        where: { id },
        data: {
          status: "COMPLETED",
          endedAt: now,
          durationSeconds,
          lastResumedAt: null,
        },
        include: sessionInclude,
      }),
    );
    return dto(completed, now);
  },
};
