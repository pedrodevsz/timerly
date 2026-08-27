import { beforeEach, describe, expect, it, vi } from "vitest";
import { projectRepository } from "./project.repository";
import { projectService } from "./project.service";

function projectRecord(id: string, userId: string, name: string) {
  return {
    id,
    userId,
    name,
    description: "",
    createdAt: new Date(),
    updatedAt: new Date(),
    subjects: [],
  };
}

describe("isolamento de projetos por usuário", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("deriva o proprietário ao criar projetos para usuários distintos", async () => {
    vi.spyOn(projectRepository, "create")
      .mockResolvedValueOnce(projectRecord("project-user-a", "user-a", "Projeto A") as never)
      .mockResolvedValueOnce(projectRecord("project-user-b", "user-b", "Projeto B") as never);
    const projectA = await projectService.create("user-a", { name: "Projeto A", description: "" });
    const projectB = await projectService.create("user-b", { name: "Projeto B", description: "" });
    expect(projectA.id).toBe("project-user-a");
    expect(projectB.id).toBe("project-user-b");
    expect(projectRepository.create).toHaveBeenNthCalledWith(1, "user-a", expect.any(Object));
    expect(projectRepository.create).toHaveBeenNthCalledWith(2, "user-b", expect.any(Object));
  });

  it.each(["consultar", "editar", "excluir"])("impede o usuário A de %s o projeto B", async (operation) => {
    vi.spyOn(projectRepository, "findById").mockResolvedValue(null);
    const update = vi.spyOn(projectRepository, "update");
    const remove = vi.spyOn(projectRepository, "delete");
    const action = operation === "consultar"
      ? projectService.get("user-a", "project-b")
      : operation === "editar"
        ? projectService.update("user-a", "project-b", { name: "Invasão" })
        : projectService.delete("user-a", "project-b");
    await expect(action).rejects.toMatchObject({ code: "PROJECT_NOT_FOUND", status: 404 });
    expect(projectRepository.findById).toHaveBeenCalledWith("user-a", "project-b");
    expect(update).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });
});
