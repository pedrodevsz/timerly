import { beforeEach, describe, expect, it, vi } from "vitest";
import { normalizeTopicName } from "@/lib/topics/parse-bulk-topics";

type TopicRecord = {
  id: number;
  name: string;
  completed: boolean;
  subjectId: string;
};

type FindManyArgs = {
  where: {
    subjectId: string;
    name?: { in: string[] };
  };
  select?: { name: true };
  orderBy?: { id: "asc" };
};

type CreateManyArgs = {
  data: Array<{ name: string; subjectId: string }>;
};

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  getPrisma: () => ({ $transaction: mocks.transaction }),
}));

import { topicRepository } from "./topic.repository";

const subjectId = "00000000-0000-4000-8000-000000000010";

function useFakeDatabase(initialNames: string[] = []) {
  const topics: TopicRecord[] = initialNames.map((name, index) => ({
    id: index + 1,
    name,
    completed: false,
    subjectId,
  }));
  const executeRaw = vi.fn();
  let lockTail = Promise.resolve();

  mocks.transaction.mockImplementation(
    async (
      callback: (transaction: {
        $executeRaw: (
          query: TemplateStringsArray,
          subject: string,
        ) => Promise<number>;
        topic: {
          findMany: (args: FindManyArgs) => Promise<Array<TopicRecord | { name: string }>>;
          createMany: (args: CreateManyArgs) => Promise<{ count: number }>;
        };
      }) => Promise<unknown>,
    ) => {
      const previousLock = lockTail;
      let releaseLock: () => void = () => {};
      lockTail = new Promise<void>((resolve) => {
        releaseLock = resolve;
      });
      let acquired = false;

      const transaction = {
        $executeRaw: async (
          query: TemplateStringsArray,
          lockedSubjectId: string,
        ) => {
          executeRaw(query, lockedSubjectId);
          await previousLock;
          acquired = true;
          return 0;
        },
        topic: {
          findMany: async (args: FindManyArgs) => {
            const requestedNames = args.where.name?.in;
            if (requestedNames) {
              return topics.filter(
                (topic) =>
                  topic.subjectId === args.where.subjectId &&
                  requestedNames.includes(topic.name),
              );
            }

            return topics
              .filter((topic) => topic.subjectId === args.where.subjectId)
              .map((topic) => ({ name: topic.name }));
          },
          createMany: async ({ data }: CreateManyArgs) => {
            for (const item of data) {
              topics.push({
                id: topics.length + 1,
                name: item.name,
                completed: false,
                subjectId: item.subjectId,
              });
            }
            return { count: data.length };
          },
        },
      };

      try {
        return await callback(transaction);
      } finally {
        if (!acquired) await previousLock;
        releaseLock();
      }
    },
  );

  return { topics, executeRaw };
}

describe("topicRepository.createMany", () => {
  beforeEach(() => vi.clearAllMocks());

  it("adquire o advisory lock com executeRaw e cria o lote", async () => {
    const { executeRaw, topics } = useFakeDatabase();

    const result = await topicRepository.createMany(subjectId, [
      "Banco de dados",
      "Normalização",
      "SQL",
      "JOIN",
    ]);

    expect(executeRaw).toHaveBeenCalledOnce();
    expect(executeRaw.mock.calls[0]?.[1]).toBe(subjectId);
    expect(result.created).toHaveLength(4);
    expect(result.skipped).toEqual([]);
    expect(topics).toHaveLength(4);
  });

  it("ignora existente e cria somente os nomes novos", async () => {
    useFakeDatabase(["SQL"]);

    const result = await topicRepository.createMany(subjectId, ["sql", "JOIN"]);

    expect(result.created.map((topic) => topic.name)).toEqual(["JOIN"]);
    expect(result.skipped).toEqual(["sql"]);
  });

  it("processa um lote maior sem tentar desserializar o retorno do lock", async () => {
    const { executeRaw } = useFakeDatabase();
    const names = Array.from({ length: 30 }, (_, index) => `Tópico ${index + 1}`);

    const result = await topicRepository.createMany(subjectId, names);

    expect(executeRaw).toHaveBeenCalledOnce();
    expect(result.created).toHaveLength(30);
  });

  it("serializa operações concorrentes e não cria variantes duplicadas", async () => {
    const { topics, executeRaw } = useFakeDatabase();

    const [first, second] = await Promise.all([
      topicRepository.createMany(subjectId, ["SQL"]),
      topicRepository.createMany(subjectId, ["sql"]),
    ]);

    expect(executeRaw).toHaveBeenCalledTimes(2);
    expect(first.created).toHaveLength(1);
    expect(second.created).toHaveLength(0);
    expect(second.skipped).toEqual(["sql"]);
    expect(
      topics.filter((topic) => normalizeTopicName(topic.name) === "sql"),
    ).toHaveLength(1);
  });
});
