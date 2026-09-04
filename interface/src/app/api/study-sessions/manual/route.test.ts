import { beforeEach, describe, expect, it, vi } from "vitest";
import { unauthorized } from "@/lib/errors/app-error";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  manualOptions: vi.fn(),
  createManual: vi.fn(),
}));

vi.mock("@/lib/auth/require-user", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/modules/study-sessions/study-session.service", () => ({
  studySessionService: {
    manualOptions: mocks.manualOptions,
    createManual: mocks.createManual,
  },
}));

import { GET, POST } from "./route";

const subjectId = "00000000-0000-4000-8000-000000000010";

function request(body: unknown) {
  return new Request("http://localhost/api/study-sessions/manual", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://localhost" },
    body: JSON.stringify(body),
  });
}

describe("API de registro manual", () => {
  beforeEach(() => vi.clearAllMocks());

  it("exige autenticação para listar opções", async () => {
    mocks.requireUser.mockRejectedValue(unauthorized());
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it("não cria estudo manual sem usuário autenticado", async () => {
    mocks.requireUser.mockRejectedValue(unauthorized());

    const response = await POST(
      request({
        subjectId,
        topic: { type: "existing", id: 7 },
        studyDate: "2026-09-01",
        durationSeconds: 3_600,
      }),
    );

    expect(response.status).toBe(401);
    expect(mocks.createManual).not.toHaveBeenCalled();
  });

  it("encaminha somente o usuário autenticado e o payload validado", async () => {
    mocks.requireUser.mockResolvedValue({ id: "user-a" });
    mocks.createManual.mockResolvedValue({ session: {}, topicCreated: false });
    const body = {
      subjectId,
      topic: { type: "existing", id: 7 },
      studyDate: "2026-09-01",
      durationSeconds: 3_600,
    };

    const response = await POST(request(body));

    expect(response.status).toBe(201);
    expect(mocks.createManual).toHaveBeenCalledWith("user-a", body);
  });

  it("rejeita data, duração e tópico inválidos", async () => {
    mocks.requireUser.mockResolvedValue({ id: "user-a" });

    const response = await POST(
      request({
        subjectId,
        topic: { type: "new", name: "x" },
        studyDate: "2026-02-30",
        durationSeconds: 0,
      }),
    );

    expect(response.status).toBe(422);
    expect(mocks.createManual).not.toHaveBeenCalled();
  });
});
