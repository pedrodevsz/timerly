import { getRedirectUrl } from "next/experimental/testing/server";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  exchangeCode: vi.fn(),
  fetchProfile: vi.fn(),
  findOrCreateUser: vi.fn(),
  createSession: vi.fn(),
}));

vi.mock("@/lib/auth/google-oauth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/auth/google-oauth")>()),
  exchangeGoogleAuthorizationCode: mocks.exchangeCode,
  fetchGoogleProfile: mocks.fetchProfile,
}));
vi.mock("@/modules/auth/google-auth.service", () => ({
  findOrCreateGoogleUser: mocks.findOrCreateUser,
}));
vi.mock("@/modules/auth/session.service", () => ({
  createSession: mocks.createSession,
}));

import { GET } from "./route";

const oauthCookies = [
  "orbe_google_oauth_state=valid-state",
  "orbe_google_oauth_verifier=valid-verifier",
  "orbe_google_oauth_source=login",
].join("; ");

describe("callback OAuth do Google", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.exchangeCode.mockResolvedValue("access-token");
    mocks.fetchProfile.mockResolvedValue({
      sub: "google-user-a",
      name: "Ana",
      email: "ana@example.com",
      email_verified: true,
    });
    mocks.findOrCreateUser.mockResolvedValue({
      id: "user-a",
      name: "Ana",
      email: "ana@example.com",
    });
  });

  it("cria a sessão e redireciona ao dashboard", async () => {
    const request = new NextRequest(
      "http://localhost/api/auth/google/callback?state=valid-state&code=code-a",
      { headers: { cookie: oauthCookies } },
    );

    const response = await GET(request);

    expect(mocks.createSession).toHaveBeenCalledWith("user-a");
    expect(getRedirectUrl(response)).toBe("http://localhost/");
  });

  it("trata cancelamento sem criar sessão", async () => {
    const request = new NextRequest(
      "http://localhost/api/auth/google/callback?state=valid-state&error=access_denied",
      { headers: { cookie: oauthCookies } },
    );

    const response = await GET(request);

    expect(mocks.createSession).not.toHaveBeenCalled();
    expect(getRedirectUrl(response)).toBe(
      "http://localhost/login?oauth_error=cancelled",
    );
  });

  it("rejeita callback com state inválido", async () => {
    const request = new NextRequest(
      "http://localhost/api/auth/google/callback?state=attacker&code=code-a",
      { headers: { cookie: oauthCookies } },
    );

    const response = await GET(request);

    expect(mocks.exchangeCode).not.toHaveBeenCalled();
    expect(getRedirectUrl(response)).toBe(
      "http://localhost/login?oauth_error=invalid_state",
    );
  });
});
