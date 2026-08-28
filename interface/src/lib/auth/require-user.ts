import "server-only";
import { unauthorized } from "@/lib/errors/app-error";
import { getCurrentUser } from "@/modules/auth/session.service";

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw unauthorized();
  }
  return user;
}
