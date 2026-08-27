import "server-only";
import { AppError } from "@/lib/errors/app-error";

type RateLimitEntry = { count: number; resetAt: number };

export interface RateLimitStore {
  increment(key: string, windowMs: number): Promise<RateLimitEntry>;
}

/**
 * Adequado apenas para desenvolvimento e instância única. Em produção distribuída,
 * substitua pelo mesmo contrato usando Redis/KV compartilhado.
 */
export class MemoryRateLimitStore implements RateLimitStore {
  private readonly entries = new Map<string, RateLimitEntry>();

  async increment(key: string, windowMs: number) {
    const now = Date.now();
    const current = this.entries.get(key);
    const next =
      !current || current.resetAt <= now
        ? { count: 1, resetAt: now + windowMs }
        : { count: current.count + 1, resetAt: current.resetAt };
    this.entries.set(key, next);
    return next;
  }
}

const globalRateLimit = globalThis as unknown as {
  authRateLimitStore?: RateLimitStore;
};

const store =
  globalRateLimit.authRateLimitStore ??
  (globalRateLimit.authRateLimitStore = new MemoryRateLimitStore());

export async function enforceRateLimit(
  request: Request,
  scope: "login" | "register",
) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const clientAddress = forwardedFor?.split(",")[0]?.trim() || "unknown";
  const policy =
    scope === "login"
      ? { limit: 10, windowMs: 15 * 60_000 }
      : { limit: 5, windowMs: 60 * 60_000 };
  const result = await store.increment(`${scope}:${clientAddress}`, policy.windowMs);

  if (result.count > policy.limit) {
    throw new AppError(
      "RATE_LIMITED",
      "Muitas tentativas. Aguarde antes de tentar novamente.",
      429,
    );
  }
}
