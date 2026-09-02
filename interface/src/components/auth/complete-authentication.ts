import { AUTHENTICATED_APP_PATH } from "@/lib/auth/session-config";
import { authApi } from "@/services/auth-service";

type Navigate = (path: string) => void;

export async function completeAuthentication(
  navigate: Navigate = (path) => window.location.replace(path),
) {
  await authApi.me();
  navigate(AUTHENTICATED_APP_PATH);
}
