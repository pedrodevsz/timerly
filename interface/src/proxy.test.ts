import { getRedirectUrl } from "next/experimental/testing/server";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { proxy } from "./proxy";

describe("proteção otimista de páginas", () => {
  it("redireciona visitante da rota privada para login", () => {
    const response = proxy(new NextRequest("http://localhost/projetos"));
    expect(getRedirectUrl(response)).toBe("http://localhost/login");
  });

  it("permite a navegação quando o cookie está presente", () => {
    const request = new NextRequest("http://localhost/projetos", { headers: { cookie: "orbe_session=token" } });
    const response = proxy(request);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
});
