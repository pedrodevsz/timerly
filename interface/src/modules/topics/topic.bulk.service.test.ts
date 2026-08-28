import { beforeEach, describe, expect, it, vi } from "vitest";
import { subjectRepository } from "@/modules/subjects/subject.repository";
import { topicRepository } from "./topic.repository";
import { topicService } from "./topic.service";

const subject = {
  id: "00000000-0000-4000-8000-000000000010",
  name: "Banco de Dados",
  projectId: "00000000-0000-4000-8000-000000000020",
  createdAt: new Date(),
  updatedAt: new Date(),
  topics: [],
};

function topic(id: number, name: string) {
  return {
    id,
    name,
    completed: false,
    subjectId: subject.id,
  };
}

describe("criação de tópicos em lote", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("cria vários tópicos para a matéria do usuário autenticado", async () => {
    vi.spyOn(subjectRepository, "findById").mockResolvedValue(subject as never);
    vi.spyOn(topicRepository, "createMany").mockResolvedValue({
      created: [topic(1, "SQL"), topic(2, "JOIN")],
      skipped: [],
    } as never);

    await expect(
      topicService.createMany("user-a", subject.id, {
        topics: ["SQL", "JOIN"],
      }),
    ).resolves.toMatchObject({
      created: [{ name: "SQL" }, { name: "JOIN" }],
      skipped: [],
    });
    expect(subjectRepository.findById).toHaveBeenCalledWith(
      "user-a",
      subject.id,
    );
  });

  it("impede o usuário A de criar tópicos na matéria do usuário B", async () => {
    vi.spyOn(subjectRepository, "findById").mockResolvedValue(null);
    const createMany = vi.spyOn(topicRepository, "createMany");

    await expect(
      topicService.createMany("user-a", subject.id, { topics: ["SQL"] }),
    ).rejects.toMatchObject({ code: "SUBJECT_NOT_FOUND", status: 404 });
    expect(createMany).not.toHaveBeenCalled();
  });

  it("remove duplicados do próprio lote antes de acessar o repository", async () => {
    vi.spyOn(subjectRepository, "findById").mockResolvedValue(subject as never);
    const createMany = vi
      .spyOn(topicRepository, "createMany")
      .mockResolvedValue({ created: [topic(1, "SQL")], skipped: [] } as never);

    await topicService.createMany("user-a", subject.id, {
      topics: ["SQL", "sql", "  SQL  "],
    });

    expect(createMany).toHaveBeenCalledWith(subject.id, ["SQL"]);
  });

  it("informa tópicos que já existem na matéria", async () => {
    vi.spyOn(subjectRepository, "findById").mockResolvedValue(subject as never);
    vi.spyOn(topicRepository, "createMany").mockResolvedValue({
      created: [topic(2, "JOIN")],
      skipped: ["SQL"],
    } as never);

    await expect(
      topicService.createMany("user-a", subject.id, {
        topics: ["SQL", "JOIN"],
      }),
    ).resolves.toEqual({
      created: [topic(2, "JOIN")],
      skipped: [{ name: "SQL", reason: "already_exists" }],
    });
  });
});
