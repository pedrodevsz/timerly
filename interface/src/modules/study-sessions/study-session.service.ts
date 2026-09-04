import { getPrisma } from "@/lib/db/prisma";
import {
  AppError,
  conflict,
  notFound,
  unauthorized,
} from "@/lib/errors/app-error";
import { runningDuration } from "@/lib/time/duration";
import {
  cleanTopicName,
  normalizeTopicName,
} from "@/lib/topics/parse-bulk-topics";
import type {
  ManualStudyOptionsDto,
  ManualStudyResultDto,
  StudySessionDto,
} from "@/types/domain";
import {
  studySessionRepository,
  sessionInclude,
} from "./study-session.repository";
import type {
  CreateStudySessionInput,
  CreateManualStudySessionInput,
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
    Math.min(
      serverNow.getTime(),
      Math.max(maximumLookback, new Date(occurredAt).getTime()),
    ),
  );
}

function requireTopicReference(topic: { id: number } | null | undefined) {
  if (!topic || !Number.isInteger(topic.id) || topic.id <= 0) {
    throw new AppError(
      "INVALID_TOPIC_REFERENCE",
      "Não foi possível vincular a sessão a um tópico válido.",
      500,
    );
  }
  return topic;
}

export const studySessionService = {
  async manualOptions(userId: string): Promise<ManualStudyOptionsDto> {
    return studySessionRepository.manualOptions(userId);
  },
  async createManual(
    userId: string,
    input: CreateManualStudySessionInput,
  ): Promise<ManualStudyResultDto> {
    if (!userId) {
      throw unauthorized();
    }
    const result = await getPrisma().$transaction(async (transaction) => {
      const subject = await transaction.subject.findFirst({
        where: { id: input.subjectId, project: { userId } },
        select: { id: true },
      });
      if (!subject) {
        throw notFound("SUBJECT_NOT_FOUND", "Matéria não encontrada.");
      }

      let topic: { id: number };
      let topicCreated = false;
      if (input.topic.type === "existing") {
        const existingTopic = await transaction.topic.findFirst({
          where: { id: input.topic.id, subjectId: subject.id },
          select: { id: true },
        });
        if (!existingTopic) {
          throw notFound(
            "TOPIC_NOT_FOUND",
            "Tópico não encontrado nesta matéria.",
          );
        }
        topic = requireTopicReference(existingTopic);
      } else {
        await transaction.$executeRaw`
          SELECT pg_advisory_xact_lock(hashtext(${subject.id}))
        `;
        const topics = await transaction.topic.findMany({
          where: { subjectId: subject.id },
          select: { id: true, name: true },
        });
        const normalizedName = normalizeTopicName(input.topic.name);
        const equivalent = topics.find(
          (item) => normalizeTopicName(item.name) === normalizedName,
        );
        if (equivalent) {
          topic = requireTopicReference(equivalent);
        } else {
          topic = requireTopicReference(
            await transaction.topic.create({
              data: {
                subjectId: subject.id,
                name: cleanTopicName(input.topic.name),
              },
              select: { id: true },
            }),
          );
          topicCreated = true;
        }
      }

      const startedAt = new Date(`${input.studyDate}T12:00:00.000Z`);
      const endedAt = new Date(
        startedAt.getTime() + input.durationSeconds * 1_000,
      );
      const session = await transaction.studySession.create({
        data: {
          userId,
          topicId: topic.id,
          startedAt,
          endedAt,
          lastTransitionAt: endedAt,
          durationSeconds: input.durationSeconds,
          status: "COMPLETED",
          lastResumedAt: null,
        },
        include: sessionInclude,
      });
      return { session, topicCreated };
    });

    return { session: dto(result.session), topicCreated: result.topicCreated };
  },
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
