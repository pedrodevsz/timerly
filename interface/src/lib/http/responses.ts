import { Prisma } from "@/generated/prisma/client";
import { ZodError, type ZodType } from "zod";
import { AppError } from "@/lib/errors/app-error";
import type { ApiFailure, ApiSuccess } from "@/types/domain";

export function ok<T>(data: T, init?: ResponseInit) {
  return Response.json({ data } satisfies ApiSuccess<T>, init);
}

export function noContent() { return new Response(null, { status: 204 }); }

export async function validatedBody<T>(request: Request, schema: ZodType<T>): Promise<T> {
  let body: unknown;
  try { body = await request.json(); } catch { throw new AppError("INVALID_JSON", "O corpo da requisição não contém JSON válido.", 400); }
  return schema.parse(body);
}

export function routeError(error: unknown) {
  if (error instanceof ZodError) {
    const details: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const key = issue.path.join(".") || "body";
      details[key] = [...(details[key] ?? []), issue.message];
    }
    return Response.json({ error: { code: "VALIDATION_ERROR", message: "Dados inválidos.", details } } satisfies ApiFailure, { status: 422 });
  }
  if (error instanceof AppError) {
    return Response.json({ error: { code: error.code, message: error.message, ...(error.details && { details: error.details }) } } satisfies ApiFailure, { status: error.status });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return Response.json({ error: { code: "DUPLICATE_RECORD", message: "Já existe um registro com estes dados." } } satisfies ApiFailure, { status: 409 });
  }
  console.error("Unhandled API error", error);
  return Response.json({ error: { code: "INTERNAL_ERROR", message: "Não foi possível concluir a operação." } } satisfies ApiFailure, { status: 500 });
}

export function withErrorHandling<TArgs extends unknown[]>(handler: (...args: TArgs) => Promise<Response>) {
  return async (...args: TArgs) => {
    try { return await handler(...args); } catch (error) { return routeError(error); }
  };
}
