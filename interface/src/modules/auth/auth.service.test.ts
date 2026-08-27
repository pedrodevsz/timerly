import { beforeEach, describe, expect, it, vi } from "vitest";
import { hashPassword, verifyPassword } from "./password.service";

const mocks = vi.hoisted(() => ({
  userCreate: vi.fn(),
  sessionCreate: vi.fn(),
  findCredentialsByEmail: vi.fn(),
  cookieSet: vi.fn(),
  KnownRequestError: class KnownRequestError extends Error {
    code: string;
    constructor(code: string) {
      super(code);
      this.code = code;
    }
  },
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: vi.fn(), set: mocks.cookieSet }),
}));
vi.mock("@/lib/db/prisma", () => ({
  getPrisma: () => ({
    $transaction: async (callback: (client: unknown) => unknown) => callback({
      user: { create: mocks.userCreate },
      authSession: { create: mocks.sessionCreate },
    }),
    authSession: { create: mocks.sessionCreate },
  }),
}));
vi.mock("@/modules/users/user.repository", () => ({
  userRepository: { findCredentialsByEmail: mocks.findCredentialsByEmail },
}));
vi.mock("@/generated/prisma/client", () => ({
  Prisma: { PrismaClientKnownRequestError: mocks.KnownRequestError },
}));

import { authService } from "./auth.service";

describe("serviço de autenticação", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sessionCreate.mockResolvedValue({ id: "session-a" });
  });

  it("cadastra com hash, cria sessão e nunca retorna passwordHash", async () => {
    let storedHash = "";
    mocks.userCreate.mockImplementation(async ({ data }: { data: { passwordHash: string } }) => {
      storedHash = data.passwordHash;
      return { id: "user-a", name: "Ana", email: "ana@example.com", passwordHash: data.passwordHash };
    });
    const user = await authService.register({ name: "Ana", email: "ana@example.com", password: "senha-segura" });
    expect(storedHash).not.toBe("senha-segura");
    await expect(verifyPassword("senha-segura", storedHash)).resolves.toBe(true);
    expect(user).toEqual({ id: "user-a", name: "Ana", email: "ana@example.com" });
    expect(user).not.toHaveProperty("passwordHash");
    expect(mocks.sessionCreate).toHaveBeenCalledOnce();
    expect(mocks.cookieSet).toHaveBeenCalledWith(
      "orbe_session",
      expect.any(String),
      expect.objectContaining({ httpOnly: true, sameSite: "lax" }),
    );
  });

  it("faz login válido e cria uma nova sessão", async () => {
    const passwordHash = await hashPassword("senha-segura");
    mocks.findCredentialsByEmail.mockResolvedValue({
      id: "user-a",
      name: "Ana",
      email: "ana@example.com",
      passwordHash,
    });
    await expect(
      authService.login({
        email: "ana@example.com",
        password: "senha-segura",
      }),
    ).resolves.toEqual({
      id: "user-a",
      name: "Ana",
      email: "ana@example.com",
    });
    expect(mocks.sessionCreate).toHaveBeenCalledOnce();
  });

  it("traduz concorrência de e-mail duplicado para conflito controlado", async () => {
    mocks.userCreate.mockRejectedValue(new mocks.KnownRequestError("P2002"));
    await expect(
      authService.register({ name: "Ana", email: "ana@example.com", password: "senha-segura" }),
    ).rejects.toMatchObject({
      code: "EMAIL_ALREADY_EXISTS",
      status: 409,
    });
  });

  it.each([
    ["e-mail inexistente", null, "qualquer-senha"],
    [
      "senha incorreta",
      {
        id: "user-a",
        name: "Ana",
        email: "ana@example.com",
        passwordHash: "hash-inválido",
      },
      "senha-errada",
    ],
  ])("retorna erro genérico para %s", async (_scenario, storedUser, password) => {
    mocks.findCredentialsByEmail.mockResolvedValue(storedUser);
    const operation = authService.login({ email: "ana@example.com", password });
    await expect(operation).rejects.toMatchObject({
      code: "INVALID_CREDENTIALS",
      status: 401,
      message: "E-mail ou senha inválidos.",
    });
  });
});
