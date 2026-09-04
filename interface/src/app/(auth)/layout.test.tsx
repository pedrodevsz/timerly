import { afterEach, describe, expect, it, vi } from "vitest";
import AuthLayout from "@/app/(auth)/layout";

const { getCurrentUser, redirect } = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/modules/auth/session.service", () => ({ getCurrentUser }));

afterEach(() => {
  getCurrentUser.mockReset();
  redirect.mockReset();
});

describe("layout das páginas de autenticação", () => {
  it("mantém o visitante na página de autenticação", async () => {
    getCurrentUser.mockResolvedValue(null);

    await AuthLayout({ children: null });

    expect(redirect).not.toHaveBeenCalled();
  });

  it("redireciona uma sessão válida para a aplicação", async () => {
    getCurrentUser.mockResolvedValue({
      id: "1",
      name: "Ana",
      email: "ana@example.com",
    });

    await AuthLayout({ children: null });

    expect(redirect).toHaveBeenCalledWith("/");
  });
});
