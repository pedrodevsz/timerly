import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { GOOGLE_PROVIDER, type GoogleProfile } from "@/lib/auth/google-oauth";
import { getPrisma } from "@/lib/db/prisma";
import { safeUserSelect } from "@/modules/users/user.repository";

const linkedUserSelect = { user: { select: safeUserSelect } } as const;

export async function findOrCreateGoogleUser(profile: GoogleProfile) {
  const database = getPrisma();
  const linkedAccount = await database.oAuthAccount.findUnique({
    where: {
      provider_providerAccountId: {
        provider: GOOGLE_PROVIDER,
        providerAccountId: profile.sub,
      },
    },
    select: linkedUserSelect,
  });

  if (linkedAccount) return linkedAccount.user;

  const email = profile.email.trim().toLowerCase();

  try {
    return await database.$transaction(async (transaction) => {
      const existingUser = await transaction.user.findUnique({
        where: { email },
        select: safeUserSelect,
      });

      if (existingUser) {
        await transaction.oAuthAccount.create({
          data: {
            provider: GOOGLE_PROVIDER,
            providerAccountId: profile.sub,
            userId: existingUser.id,
          },
        });
        return existingUser;
      }

      return transaction.user.create({
        data: {
          name: profile.name,
          email,
          passwordHash: null,
          oauthAccounts: {
            create: {
              provider: GOOGLE_PROVIDER,
              providerAccountId: profile.sub,
            },
          },
        },
        select: safeUserSelect,
      });
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const accountCreatedConcurrently = await database.oAuthAccount.findUnique({
        where: {
          provider_providerAccountId: {
            provider: GOOGLE_PROVIDER,
            providerAccountId: profile.sub,
          },
        },
        select: linkedUserSelect,
      });
      if (accountCreatedConcurrently) return accountCreatedConcurrently.user;
    }
    throw error;
  }
}
