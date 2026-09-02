import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { AppError } from "@/lib/errors/app-error";
import type { GoogleAuthSource } from "@/lib/auth/session-config";

export const GOOGLE_PROVIDER = "google";
export const GOOGLE_OAUTH_STATE_COOKIE = "orbe_google_oauth_state";
export const GOOGLE_OAUTH_VERIFIER_COOKIE = "orbe_google_oauth_verifier";
export const GOOGLE_OAUTH_SOURCE_COOKIE = "orbe_google_oauth_source";
export const GOOGLE_OAUTH_CALLBACK_PATH = "/api/auth/google/callback";
export const GOOGLE_OAUTH_COOKIE_MAX_AGE = 60 * 10;

const tokenResponseSchema = z.object({
  access_token: z.string().min(1),
});

const googleProfileSchema = z.object({
  sub: z.string().min(1).max(255),
  email: z.string().email(),
  email_verified: z.literal(true),
  name: z.string().trim().min(1).max(120),
});

export type GoogleProfile = z.infer<typeof googleProfileSchema>;

function oauthConfiguration() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new AppError(
      "GOOGLE_OAUTH_NOT_CONFIGURED",
      "A entrada com Google ainda não está configurada.",
      503,
    );
  }

  return { clientId, clientSecret };
}

export function normalizeGoogleAuthSource(value: string | null): GoogleAuthSource {
  return value === "register" ? "register" : "login";
}

export function googleOAuthCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth/google",
    maxAge: GOOGLE_OAUTH_COOKIE_MAX_AGE,
  };
}

export function createGoogleOAuthAttempt() {
  const state = randomBytes(32).toString("base64url");
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { state, verifier, challenge };
}

export function isValidOAuthState(received: string | null, stored: string | undefined) {
  if (!received || !stored) return false;
  const receivedBuffer = Buffer.from(received);
  const storedBuffer = Buffer.from(stored);
  return (
    receivedBuffer.length === storedBuffer.length &&
    timingSafeEqual(receivedBuffer, storedBuffer)
  );
}

export function googleCallbackUrl(requestUrl: string) {
  return new URL(GOOGLE_OAUTH_CALLBACK_PATH, requestUrl).toString();
}

export function createGoogleAuthorizationUrl(
  requestUrl: string,
  attempt: ReturnType<typeof createGoogleOAuthAttempt>,
) {
  const { clientId } = oauthConfiguration();
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: googleCallbackUrl(requestUrl),
    response_type: "code",
    scope: "openid email profile",
    state: attempt.state,
    code_challenge: attempt.challenge,
    code_challenge_method: "S256",
  }).toString();
  return url;
}

export async function exchangeGoogleAuthorizationCode(
  code: string,
  verifier: string,
  requestUrl: string,
  fetcher: typeof fetch = fetch,
) {
  const { clientId, clientSecret } = oauthConfiguration();
  const response = await fetcher("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      code_verifier: verifier,
      grant_type: "authorization_code",
      redirect_uri: googleCallbackUrl(requestUrl),
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new AppError(
      "GOOGLE_TOKEN_EXCHANGE_FAILED",
      "Não foi possível validar a autorização do Google.",
      401,
    );
  }

  return tokenResponseSchema.parse(await response.json()).access_token;
}

export async function fetchGoogleProfile(
  accessToken: string,
  fetcher: typeof fetch = fetch,
) {
  const response = await fetcher(
    "https://openidconnect.googleapis.com/v1/userinfo",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new AppError(
      "GOOGLE_PROFILE_FAILED",
      "Não foi possível validar o perfil do Google.",
      401,
    );
  }

  return googleProfileSchema.parse(await response.json());
}
