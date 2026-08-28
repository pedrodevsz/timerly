import { beforeEach, describe, expect, it, vi } from "vitest";
import { unauthorized } from "@/lib/errors/app-error";

const mocks = vi.hoisted(() => ({ requireUser: vi.fn(), list: vi.fn() }));
vi.mock("@/lib/auth/require-user", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/modules/projects/project.service", () => ({ projectService: { list: mocks.list, create: vi.fn() } }));

import { GET } from "./route";

describe("API privada de projetos", () => {
  beforeEach(() => vi.clearAllMocks());

  it("responde 401 sem sessão", async () => {
    mocks.requireUser.mockRejectedValue(unauthorized());
    const response = await GET();
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "UNAUTHORIZED" } });
  });

  it("permite sessão válida e filtra pelo usuário autenticado", async () => {
    mocks.requireUser.mockResolvedValue({ id: "user-a", name: "Ana", email: "ana@example.com" });
    mocks.list.mockResolvedValue([]);
    const response = await GET();
    expect(response.status).toBe(200);
    expect(mocks.list).toHaveBeenCalledWith("user-a");
  });
});
