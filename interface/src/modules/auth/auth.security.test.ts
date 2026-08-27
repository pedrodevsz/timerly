import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "./auth.schema";
import { hashPassword, verifyPassword } from "./password.service";
import { createSessionCredentials, hashSessionToken, SESSION_TTL_SECONDS } from "./session.service";

describe("primitivas de autenticação", () => {
  it("normaliza e valida cadastro e login", () => {
    const register = registerSchema.parse({ name: "  Ana  ", email: " ANA@EXAMPLE.COM ", password: "senha-segura" });
    const login = loginSchema.parse({ email: " ANA@EXAMPLE.COM ", password: "senha-segura" });
    expect(register).toEqual({ name: "Ana", email: "ana@example.com", password: "senha-segura" });
    expect(login.email).toBe("ana@example.com");
    expect(registerSchema.safeParse({ name: "Ana", email: "inválido", password: "curta" }).success).toBe(false);
  });

  it("armazena senha como Argon2id e verifica exclusivamente pela biblioteca", async () => {
    const hash = await hashPassword("senha-segura");
    expect(hash).toMatch(/^\$argon2id\$/);
    expect(hash).not.toContain("senha-segura");
    await expect(verifyPassword("senha-segura", hash)).resolves.toBe(true);
    await expect(verifyPassword("senha-incorreta", hash)).resolves.toBe(false);
  });

  it("gera tokens de sessão imprevisíveis e persiste somente seu hash", () => {
    const now = new Date("2026-08-27T12:00:00.000Z");
    const first = createSessionCredentials(now);
    const second = createSessionCredentials(now);
    expect(first.token).not.toBe(second.token);
    expect(first.tokenHash).toHaveLength(64);
    expect(first.tokenHash).toBe(hashSessionToken(first.token));
    expect(first.tokenHash).not.toContain(first.token);
    expect(first.expiresAt.getTime() - now.getTime()).toBe(SESSION_TTL_SECONDS * 1000);
  });
});
