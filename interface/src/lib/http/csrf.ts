import "server-only";
import { forbidden } from "@/lib/errors/app-error";

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");

  if (fetchSite === "cross-site") {
    throw forbidden("INVALID_ORIGIN", "Origem da requisição não permitida.");
  }

  if (origin && origin !== new URL(request.url).origin) {
    throw forbidden("INVALID_ORIGIN", "Origem da requisição não permitida.");
  }
}
