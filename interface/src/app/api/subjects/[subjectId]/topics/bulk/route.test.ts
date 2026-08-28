import { beforeEach, describe, expect, it, vi } from "vitest";
import { unauthorized } from "@/lib/errors/app-error";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  createMany: vi.fn(),
}));

vi.mock("@/lib/auth/require-user", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/modules/topics/topic.service", () => ({
  topicService: { createMany: mocks.createMany },
}));

import { POST } from "./route";

const subjectId = "00000000-0000-4000-8000-000000000010";

function request(topics: string[]) {
  return new Request(`http://localhost/api/subjects/${subjectId}/topics/bulk`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
    },
    body: JSON.stringify({ topics }),
  });
}

function context() {
  return { params: Promise.resolve({ subjectId }) };
}

describe("API de tópicos em lote", () => {
  beforeEach(() => vi.clearAllMocks());

  it("responde 401 sem sessão", async () => {
    mocks.requireUser.mockRejectedValue(unauthorized());

    const response = await POST(request(["SQL"]), context());

    expect(response.status).toBe(401);
    expect(mocks.createMany).not.toHaveBeenCalled();
  });

  it("cria o lote usando somente o usuário autenticado", async () => {
    mocks.requireUser.mockResolvedValue({ id: "user-a" });
    mocks.createMany.mockResolvedValue({ created: [], skipped: [] });

    const response = await POST(request(["SQL", "JOIN"]), context());

    expect(response.status).toBe(201);
    expect(mocks.createMany).toHaveBeenCalledWith("user-a", subjectId, {
      topics: ["SQL", "JOIN"],
    });
  });

  it("rejeita payload vazio", async () => {
    mocks.requireUser.mockResolvedValue({ id: "user-a" });

    const response = await POST(request([]), context());

    expect(response.status).toBe(422);
    expect(mocks.createMany).not.toHaveBeenCalled();
  });

  it("rejeita lote acima do limite", async () => {
    mocks.requireUser.mockResolvedValue({ id: "user-a" });

    const response = await POST(
      request(Array.from({ length: 101 }, (_, index) => `Tópico ${index}`)),
      context(),
    );

    expect(response.status).toBe(422);
    expect(mocks.createMany).not.toHaveBeenCalled();
  });
});
