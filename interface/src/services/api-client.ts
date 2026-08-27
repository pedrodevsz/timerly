import type { ApiFailure, ApiSuccess } from "@/types/domain";

export class ApiClientError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(path, {
    credentials: "same-origin",
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  if (response.status === 204) return undefined as T;
  const payload = await response.json() as ApiSuccess<T> | ApiFailure;
  if (!response.ok || "error" in payload) {
    const failure =
      "error" in payload
        ? payload.error
        : {
            code: "REQUEST_FAILED",
            message: "Não foi possível concluir a solicitação.",
          };
    throw new ApiClientError(
      failure.code,
      failure.message,
      response.status,
      failure.details,
    );
  }
  return payload.data;
}
