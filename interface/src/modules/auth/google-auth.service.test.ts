import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  accountFindUnique: vi.fn(),
  accountCreate: vi.fn(),
  userFindUnique: vi.fn(),
  userCreate: vi.fn(),
  transaction: vi.fn(),
  KnownRequestError: class KnownRequestError extends Error {
    code: string;
    constructor(code: string) {
      super(code);
      this.code = code;
    }
  },
}));

vi.mock("@/lib/db/prisma", () => ({
  getPrisma: () => ({
    oAuthAccount: { findUnique: mocks.accountFindUnique },
    $transaction: mocks.transaction,
  }),
}));
vi.mock("@/generated/prisma/client", () => ({
  Prisma: { PrismaClientKnownRequestError: mocks.KnownRequestError },
}));

import { findOrCreateGoogleUser } from "./google-auth.service";

const profile = {
  sub: "google-user-a",
  name: "Ana Google",
  email: "ANA@EXAMPLE.COM",
  email_verified: true as const,
};

const existingUser = {
  id: "user-a",
  name: "Ana Local",
  email: "ana@example.com",
};

describe("vinculação de conta Google", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(
      async (callback: (transaction: unknown) => unknown) =>
        callback({
          user: {
            findUnique: mocks.userFindUnique,
            create: mocks.userCreate,
          },
          oAuthAccount: { create: mocks.accountCreate },
        }),
    );
  });

  it("entra com um vínculo Google já existente", async () => {
    mocks.accountFindUnique.mockResolvedValue({ user: existingUser });

    await expect(findOrCreateGoogleUser(profile)).resolves.toEqual(existingUser);

    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("cria usuário sem senha no primeiro login Google", async () => {
    mocks.accountFindUnique.mockResolvedValue(null);
    mocks.userFindUnique.mockResolvedValue(null);
    mocks.userCreate.mockResolvedValue({
      id: "user-new",
      name: "Ana Google",
      email: "ana@example.com",
    });

    await findOrCreateGoogleUser(profile);

    expect(mocks.userCreate).toHaveBeenCalledWith({
      data: {
        name: "Ana Google",
        email: "ana@example.com",
        passwordHash: null,
        oauthAccounts: {
          create: { provider: "google", providerAccountId: "google-user-a" },
        },
      },
      select: { id: true, name: true, email: true },
    });
  });

  it("vincula pelo e-mail verificado sem alterar a conta local", async () => {
    mocks.accountFindUnique.mockResolvedValue(null);
    mocks.userFindUnique.mockResolvedValue(existingUser);
    mocks.accountCreate.mockResolvedValue({ id: "account-a" });

    await expect(findOrCreateGoogleUser(profile)).resolves.toEqual(existingUser);

    expect(mocks.accountCreate).toHaveBeenCalledWith({
      data: {
        provider: "google",
        providerAccountId: "google-user-a",
        userId: "user-a",
      },
    });
    expect(mocks.userCreate).not.toHaveBeenCalled();
  });
});
