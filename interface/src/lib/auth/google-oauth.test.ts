import { afterEach, describe, expect, it } from "vitest";
import {
  createGoogleAuthorizationUrl,
  createGoogleOAuthAttempt,
  googleCallbackUrl,
  isValidOAuthState,
} from "./google-oauth";

const previousClientId = process.env.GOOGLE_CLIENT_ID;
const previousClientSecret = process.env.GOOGLE_CLIENT_SECRET;

afterEach(() => {
  if (previousClientId === undefined) delete process.env.GOOGLE_CLIENT_ID;
  else process.env.GOOGLE_CLIENT_ID = previousClientId;
  if (previousClientSecret === undefined) delete process.env.GOOGLE_CLIENT_SECRET;
  else process.env.GOOGLE_CLIENT_SECRET = previousClientSecret;
});

describe("fluxo OAuth do Google", () => {
  it("gera state e PKCE imprevisíveis", () => {
    const first = createGoogleOAuthAttempt();
    const second = createGoogleOAuthAttempt();

    expect(first.state).not.toBe(second.state);
    expect(first.verifier).not.toBe(second.verifier);
    expect(first.challenge).not.toBe(first.verifier);
    expect(isValidOAuthState(first.state, first.state)).toBe(true);
    expect(isValidOAuthState(first.state, second.state)).toBe(false);
  });

  it("deriva o callback da origem atual sem fixar localhost", () => {
    expect(googleCallbackUrl("https://orbe.example/login")).toBe(
      "https://orbe.example/api/auth/google/callback",
    );
  });

  it("monta a autorização com state, PKCE e escopos mínimos", () => {
    process.env.GOOGLE_CLIENT_ID = "client-id";
    process.env.GOOGLE_CLIENT_SECRET = "client-secret";
    const attempt = createGoogleOAuthAttempt();
    const url = createGoogleAuthorizationUrl(
      "https://orbe.example/api/auth/google",
      attempt,
    );

    expect(url.origin).toBe("https://accounts.google.com");
    expect(url.searchParams.get("redirect_uri")).toBe(
      "https://orbe.example/api/auth/google/callback",
    );
    expect(url.searchParams.get("state")).toBe(attempt.state);
    expect(url.searchParams.get("code_challenge")).toBe(attempt.challenge);
    expect(url.searchParams.get("scope")).toBe("openid email profile");
  });
});
