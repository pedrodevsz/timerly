import { NextResponse, type NextRequest } from "next/server";
import {
  createGoogleAuthorizationUrl,
  createGoogleOAuthAttempt,
  GOOGLE_OAUTH_SOURCE_COOKIE,
  GOOGLE_OAUTH_STATE_COOKIE,
  GOOGLE_OAUTH_VERIFIER_COOKIE,
  googleOAuthCookieOptions,
  normalizeGoogleAuthSource,
} from "@/lib/auth/google-oauth";
import { enforceRateLimit } from "@/lib/rate-limit/rate-limiter";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const source = normalizeGoogleAuthSource(request.nextUrl.searchParams.get("source"));

  try {
    await enforceRateLimit(request, "login");
    const attempt = createGoogleOAuthAttempt();
    const response = NextResponse.redirect(
      createGoogleAuthorizationUrl(request.url, attempt),
    );
    const cookieOptions = googleOAuthCookieOptions();
    response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, attempt.state, cookieOptions);
    response.cookies.set(
      GOOGLE_OAUTH_VERIFIER_COOKIE,
      attempt.verifier,
      cookieOptions,
    );
    response.cookies.set(GOOGLE_OAUTH_SOURCE_COOKIE, source, cookieOptions);
    return response;
  } catch (error) {
    console.error("Unable to start Google OAuth", error);
    return NextResponse.redirect(
      new URL(`/${source}?oauth_error=unavailable`, request.url),
    );
  }
}
