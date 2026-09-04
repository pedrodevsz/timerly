import type { GoogleAuthSource } from "@/lib/auth/session-config";

type Navigate = (path: string) => void;

export function beginGoogleAuthentication(
  source: GoogleAuthSource,
  navigate: Navigate = (path) => window.location.assign(path),
) {
  navigate(`/api/auth/google?source=${source}`);
}
