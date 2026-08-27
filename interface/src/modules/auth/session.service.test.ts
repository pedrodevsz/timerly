import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookies: vi.fn(),
  findUnique: vi.fn(),
  deleteMany: vi.fn(),
  cookieSet: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: mocks.cookies }));
vi.mock("@/lib/db/prisma", () => ({
  getPrisma: () => ({
    authSession: {
      findUnique: mocks.findUnique,
      deleteMany: mocks.deleteMany,
    },
  }),
}));

import { deleteCurrentSession, getCurrentUser, SESSION_COOKIE_NAME } from "./session.service";

describe("sessão persistida", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.cookies.mockResolvedValue({
      get: () => ({ value: "token-secreto" }),
      set: mocks.cookieSet,
    });
  });

  it("retorna o usuário de uma sessão válida", async () => {
    const user = { id: "user-a", name: "Ana", email: "ana@example.com" };
    mocks.findUnique.mockResolvedValue({ id: "session-a", expiresAt: new Date(Date.now() + 60_000), user });
    await expect(getCurrentUser()).resolves.toEqual(user);
  });

  it("trata sessão inexistente como não autenticada", async () => {
    mocks.findUnique.mockResolvedValue(null);
    await expect(getCurrentUser()).resolves.toBeNull();
  });

  it("remove e rejeita sessão expirada", async () => {
    mocks.findUnique.mockResolvedValue({ id: "expired", expiresAt: new Date(Date.now() - 1), user: { id: "user-a" } });
    await expect(getCurrentUser()).resolves.toBeNull();
    expect(mocks.deleteMany).toHaveBeenCalledWith({ where: { id: "expired" } });
  });

  it("logout invalida a sessão no servidor e expira o cookie", async () => {
    await deleteCurrentSession();
    expect(mocks.deleteMany).toHaveBeenCalledOnce();
    expect(mocks.cookieSet).toHaveBeenCalledWith(
      SESSION_COOKIE_NAME,
      "",
      expect.objectContaining({ httpOnly: true, sameSite: "lax", maxAge: 0 }),
    );
  });
});
