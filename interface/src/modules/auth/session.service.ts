import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { Prisma } from "@/generated/prisma/client";
import {
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
} from "@/lib/auth/session-config";
import { getPrisma } from "@/lib/db/prisma";

export { SESSION_COOKIE_NAME, SESSION_TTL_SECONDS };

type DatabaseClient = ReturnType<typeof getPrisma> | Prisma.TransactionClient;

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createSessionCredentials(now = new Date()) {
  const token = randomBytes(32).toString("base64url");
  return {
    token,
    tokenHash: hashSessionToken(token),
    expiresAt: new Date(now.getTime() + SESSION_TTL_SECONDS * 1000),
  };
}

export function createSessionRecord(
  client: DatabaseClient,
  userId: string,
  credentials = createSessionCredentials(),
) {
  return client.authSession.create({
    data: {
      userId,
      tokenHash: credentials.tokenHash,
      expiresAt: credentials.expiresAt,
    },
  });
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function createSession(userId: string) {
  const credentials = createSessionCredentials();
  await createSessionRecord(getPrisma(), userId, credentials);
  await setSessionCookie(credentials.token, credentials.expiresAt);
}

export async function getCurrentUser() {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  const session = await getPrisma().authSession.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt <= new Date()) {
    await getPrisma().authSession.deleteMany({ where: { id: session.id } });
    return null;
  }

  return session.user;
}

export async function deleteCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await getPrisma().authSession.deleteMany({
      where: { tokenHash: hashSessionToken(token) },
    });
  }

  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
    maxAge: 0,
  });
}
