import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";
import { authApi } from "@/services/auth-service";

const replace = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh }),
}));

afterEach(() => {
  vi.restoreAllMocks();
  replace.mockReset();
  refresh.mockReset();
});

describe("fluxo visual de autenticação", () => {
  it("renderiza o login com navegação para cadastro e opção Google", () => {
    render(<LoginForm />);
    expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
    expect(screen.getByLabelText("Senha")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continuar com Google" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Criar conta" })).toHaveAttribute("href", "/register");
  });

  it("mostra os erros de login perto dos campos", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    expect(screen.getByText("Informe seu e-mail.")).toBeInTheDocument();
    expect(screen.getByText("Informe sua senha.")).toBeInTheDocument();
    await user.type(screen.getByLabelText("E-mail"), "email-invalido");
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    expect(screen.getByText("Informe um e-mail válido.")).toBeInTheDocument();
  });

  it("envia o login real, bloqueia reenvio e redireciona após sucesso", async () => {
    let finishLogin: (() => void) | undefined;
    vi.spyOn(authApi, "login").mockImplementation(
      () => new Promise((resolve) => { finishLogin = () => resolve({ user: { id: "1", name: "Ana", email: "ana@example.com" } }); }),
    );
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.type(screen.getByLabelText("E-mail"), "ana@example.com");
    await user.type(screen.getByLabelText("Senha"), "senha-segura");
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    expect(screen.getByRole("button", { name: "Entrando…" })).toBeDisabled();
    expect(authApi.login).toHaveBeenCalledTimes(1);
    finishLogin?.();
    await vi.waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
  });

  it("valida cadastro, incluindo tamanho e confirmação da senha", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);
    expect(screen.getByRole("link", { name: "Entrar" })).toHaveAttribute("href", "/login");
    await user.click(screen.getByRole("button", { name: "Criar conta" }));
    expect(screen.getByText("Informe seu nome.")).toBeInTheDocument();
    expect(screen.getByText("Informe seu e-mail.")).toBeInTheDocument();
    expect(screen.getByText("A senha precisa ter pelo menos 8 caracteres.")).toBeInTheDocument();
    expect(screen.getByText("Confirme sua senha.")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Nome"), "Ana");
    await user.type(screen.getByLabelText("E-mail"), "ana@example.com");
    await user.type(screen.getByLabelText("Senha"), "senha-segura");
    await user.type(screen.getByLabelText("Confirmar senha"), "outra-senha");
    await user.click(screen.getByRole("button", { name: "Criar conta" }));
    expect(screen.getByText("As senhas precisam ser iguais.")).toBeInTheDocument();
  });

  it("mantém Google sem OAuth ou sucesso simulado", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.click(screen.getByRole("button", { name: "Continuar com Google" }));
    expect(screen.getByRole("status")).toHaveTextContent("será conectada na próxima etapa");
    expect(replace).not.toHaveBeenCalled();
  });
});
