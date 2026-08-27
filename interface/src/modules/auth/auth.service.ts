import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/db/prisma";
import { AppError, conflict } from "@/lib/errors/app-error";
import { userRepository } from "@/modules/users/user.repository";
import type { LoginInput, RegisterInput } from "./auth.schema";
import { hashPassword, verifyPassword } from "./password.service";
import {
  createSession,
  createSessionCredentials,
  createSessionRecord,
  setSessionCookie,
} from "./session.service";

const invalidCredentialHash = hashPassword("invalid-credential-placeholder");

function safeUser(user: { id: string; name: string; email: string }) {
  return { id: user.id, name: user.name, email: user.email };
}

export const authService = {
  async register(input: RegisterInput) {
    const passwordHash = await hashPassword(input.password);
    const session = createSessionCredentials();

    try {
      const user = await getPrisma().$transaction(async (transaction) => {
        const created = await transaction.user.create({
          data: {
            name: input.name,
            email: input.email,
            passwordHash,
          },
          select: { id: true, name: true, email: true },
        });
        await createSessionRecord(transaction, created.id, session);
        return created;
      });

      await setSessionCookie(session.token, session.expiresAt);
      return safeUser(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw conflict("EMAIL_ALREADY_EXISTS", "Este e-mail já está cadastrado.");
      }
      throw error;
    }
  },

  async login(input: LoginInput) {
    const user = await userRepository.findCredentialsByEmail(input.email);
    const passwordHash = user?.passwordHash ?? (await invalidCredentialHash);
    const validPassword = await verifyPassword(input.password, passwordHash);

    if (!user || !user.passwordHash || !validPassword) {
      throw new AppError(
        "INVALID_CREDENTIALS",
        "E-mail ou senha inválidos.",
        401,
      );
    }

    await createSession(user.id);
    return safeUser(user);
  },
};
