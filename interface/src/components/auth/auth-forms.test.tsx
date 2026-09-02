import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";
import { authApi } from "@/services/auth-service";

const completeAuthentication = vi.hoisted(() => vi.fn());
const beginGoogleAuthentication = vi.hoisted(() => vi.fn());

vi.mock("@/components/auth/complete-authentication", () => ({
  completeAuthentication,
}));
vi.mock("@/components/auth/begin-google-authentication", () => ({
  beginGoogleAuthentication,
}));

afterEach(() => {
  vi.restoreAllMocks();
  completeAuthentication.mockReset();
  beginGoogleAuthentication.mockReset();
  window.history.replaceState(null, "", "/");
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
    await vi.waitFor(() => expect(completeAuthentication).toHaveBeenCalledOnce());
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

  it("inicia o OAuth do Google pelo login e bloqueia novos cliques", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.click(screen.getByRole("button", { name: "Continuar com Google" }));
    expect(beginGoogleAuthentication).toHaveBeenCalledWith("login");
    expect(screen.getByRole("button", { name: "Redirecionando…" })).toBeDisabled();
    expect(completeAuthentication).not.toHaveBeenCalled();
  });

  it("inicia o mesmo OAuth do Google pelo cadastro", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);
    await user.click(screen.getByRole("button", { name: "Continuar com Google" }));
    expect(beginGoogleAuthentication).toHaveBeenCalledWith("register");
  });

  it("exibe o cancelamento do Google sem quebrar o login", async () => {
    window.history.replaceState(null, "", "/login?oauth_error=cancelled");
    render(<LoginForm />);
    expect(await screen.findByRole("status")).toHaveTextContent(
      "A entrada com Google foi cancelada.",
    );
    expect(window.location.search).toBe("");
  });

  it("conclui a autenticação depois de criar a conta", async () => {
    vi.spyOn(authApi, "register").mockResolvedValue({
      user: { id: "1", name: "Ana", email: "ana@example.com" },
    });
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText("Nome"), "Ana");
    await user.type(screen.getByLabelText("E-mail"), "ana@example.com");
    await user.type(screen.getByLabelText("Senha"), "senha-segura");
    await user.type(screen.getByLabelText("Confirmar senha"), "senha-segura");
    await user.click(screen.getByRole("button", { name: "Criar conta" }));

    await vi.waitFor(() => expect(authApi.register).toHaveBeenCalledOnce());
    expect(completeAuthentication).toHaveBeenCalledOnce();
  });
});
