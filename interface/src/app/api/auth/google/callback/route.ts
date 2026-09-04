import { NextResponse, type NextRequest } from "next/server";
import { AUTHENTICATED_APP_PATH } from "@/lib/auth/session-config";
import {
  exchangeGoogleAuthorizationCode,
  fetchGoogleProfile,
  GOOGLE_OAUTH_SOURCE_COOKIE,
  GOOGLE_OAUTH_STATE_COOKIE,
  GOOGLE_OAUTH_VERIFIER_COOKIE,
  isValidOAuthState,
  normalizeGoogleAuthSource,
} from "@/lib/auth/google-oauth";
import { findOrCreateGoogleUser } from "@/modules/auth/google-auth.service";
import { createSession } from "@/modules/auth/session.service";

export const dynamic = "force-dynamic";

const oauthCookieNames = [
  GOOGLE_OAUTH_STATE_COOKIE,
  GOOGLE_OAUTH_VERIFIER_COOKIE,
  GOOGLE_OAUTH_SOURCE_COOKIE,
];

function clearOAuthCookies(response: NextResponse) {
  for (const name of oauthCookieNames) {
    response.cookies.set(name, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/api/auth/google",
      expires: new Date(0),
      maxAge: 0,
    });
  }
  return response;
}

export async function GET(request: NextRequest) {
  const source = normalizeGoogleAuthSource(
    request.cookies.get(GOOGLE_OAUTH_SOURCE_COOKIE)?.value ?? null,
  );
  const receivedState = request.nextUrl.searchParams.get("state");
  const storedState = request.cookies.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;

  if (!isValidOAuthState(receivedState, storedState)) {
    return clearOAuthCookies(
      NextResponse.redirect(
        new URL(`/${source}?oauth_error=invalid_state`, request.url),
      ),
    );
  }

  if (request.nextUrl.searchParams.get("error")) {
    return clearOAuthCookies(
      NextResponse.redirect(
        new URL(`/${source}?oauth_error=cancelled`, request.url),
      ),
    );
  }

  const code = request.nextUrl.searchParams.get("code");
  const verifier = request.cookies.get(GOOGLE_OAUTH_VERIFIER_COOKIE)?.value;
  if (!code || !verifier) {
    return clearOAuthCookies(
      NextResponse.redirect(
        new URL(`/${source}?oauth_error=invalid_response`, request.url),
      ),
    );
  }

  try {
    const accessToken = await exchangeGoogleAuthorizationCode(
      code,
      verifier,
      request.url,
    );
    const profile = await fetchGoogleProfile(accessToken);
    const user = await findOrCreateGoogleUser(profile);
    await createSession(user.id);
    return clearOAuthCookies(
      NextResponse.redirect(
        new URL(AUTHENTICATED_APP_PATH, request.url),
      ),
    );
  } catch (error) {
    console.error("Google OAuth callback failed", error);
    return clearOAuthCookies(
      NextResponse.redirect(
        new URL(`/${source}?oauth_error=failed`, request.url),
      ),
    );
  }
}
