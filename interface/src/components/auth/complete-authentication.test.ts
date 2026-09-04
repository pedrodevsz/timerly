import { afterEach, describe, expect, it, vi } from "vitest";
import { completeAuthentication } from "@/components/auth/complete-authentication";
import { authApi } from "@/services/auth-service";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("conclusão da autenticação", () => {
  it("confirma a sessão antes de iniciar uma navegação completa", async () => {
    const me = vi.spyOn(authApi, "me").mockResolvedValue({
      user: { id: "1", name: "Ana", email: "ana@example.com" },
    });
    const navigate = vi.fn();

    await completeAuthentication(navigate);

    expect(me).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith("/");
    expect(me.mock.invocationCallOrder[0]).toBeLessThan(
      navigate.mock.invocationCallOrder[0],
    );
  });

  it("não navega quando a sessão ainda não pode ser confirmada", async () => {
    vi.spyOn(authApi, "me").mockRejectedValue(new Error("Sessão ausente."));
    const navigate = vi.fn();

    await expect(completeAuthentication(navigate)).rejects.toThrow(
      "Sessão ausente.",
    );
    expect(navigate).not.toHaveBeenCalled();
  });
});
