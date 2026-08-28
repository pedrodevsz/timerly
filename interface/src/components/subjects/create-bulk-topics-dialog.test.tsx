import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CreateBulkTopicsDialog } from "./create-bulk-topics-dialog";
import { projectApi } from "@/services/project-service";

const subject = {
  id: "00000000-0000-4000-8000-000000000010",
  projectId: "00000000-0000-4000-8000-000000000020",
  name: "Banco de Dados",
  progress: 0,
  topics: [
    {
      id: 1,
      name: "Normalização",
      completed: false,
      subjectId: "00000000-0000-4000-8000-000000000010",
    },
  ],
};

afterEach(() => vi.restoreAllMocks());

describe("CreateBulkTopicsDialog", () => {
  it("processa, exibe a prévia e permite voltar para editar", async () => {
    const user = userEvent.setup();
    render(
      <CreateBulkTopicsDialog
        open
        subject={subject}
        onOpenChange={vi.fn()}
        onCreated={vi.fn()}
      />,
    );

    const textarea = screen.getByLabelText(
      "Cole os tópicos abaixo, um por linha.",
    );
    await user.type(textarea, "SQL{enter}{enter} JOIN {enter}sql{enter}Normalização");
    await user.click(screen.getByRole("button", { name: "Revisar tópicos" }));

    expect(screen.getByText("4 linhas encontradas")).toBeInTheDocument();
    expect(screen.getByText("2 prontos para adicionar")).toBeInTheDocument();
    expect(screen.getByText("1 duplicado ignorado")).toBeInTheDocument();
    expect(screen.getByText("1 já existente")).toBeInTheDocument();
    expect(screen.getByText("Normalização")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Voltar" }));
    expect(textarea).toHaveValue(
      "SQL\n\n JOIN \nsql\nNormalização",
    );
  });

  it("bloqueia reenvio, conclui e fecha depois do sucesso", async () => {
    let resolveRequest:
      | ((result: Awaited<ReturnType<typeof projectApi.createTopicsBulk>>) => void)
      | undefined;
    vi.spyOn(projectApi, "createTopicsBulk").mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        }),
    );
    const onCreated = vi.fn();
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(
      <CreateBulkTopicsDialog
        open
        subject={{ ...subject, topics: [] }}
        onOpenChange={onOpenChange}
        onCreated={onCreated}
      />,
    );

    await user.type(
      screen.getByLabelText("Cole os tópicos abaixo, um por linha."),
      "SQL{enter}JOIN",
    );
    await user.click(screen.getByRole("button", { name: "Revisar tópicos" }));
    await user.click(screen.getByRole("button", { name: "Adicionar 2 tópicos" }));

    expect(screen.getByRole("button", { name: "Adicionando…" })).toBeDisabled();
    resolveRequest?.({
      created: [
        { id: 2, name: "SQL", completed: false, subjectId: subject.id },
        { id: 3, name: "JOIN", completed: false, subjectId: subject.id },
      ],
      skipped: [],
    });

    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("mantém a prévia e permite tentar novamente após erro", async () => {
    vi.spyOn(projectApi, "createTopicsBulk").mockRejectedValueOnce(
      new Error("Falha temporária."),
    );
    const user = userEvent.setup();
    render(
      <CreateBulkTopicsDialog
        open
        subject={{ ...subject, topics: [] }}
        onOpenChange={vi.fn()}
        onCreated={vi.fn()}
      />,
    );

    await user.type(
      screen.getByLabelText("Cole os tópicos abaixo, um por linha."),
      "SQL",
    );
    await user.click(screen.getByRole("button", { name: "Revisar tópicos" }));
    await user.click(screen.getByRole("button", { name: "Adicionar 1 tópico" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Falha temporária.",
    );
    expect(
      screen.getByRole("button", { name: "Adicionar 1 tópico" }),
    ).toBeEnabled();
    expect(screen.getByText("SQL")).toBeInTheDocument();
  });

  it("limpa o conteúdo quando o modal é fechado e aberto novamente", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    const props = {
      subject,
      onOpenChange,
      onCreated: vi.fn(),
    };
    const { rerender } = render(
      <CreateBulkTopicsDialog open {...props} />,
    );

    await user.type(
      screen.getByLabelText("Cole os tópicos abaixo, um por linha."),
      "SQL",
    );
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    rerender(<CreateBulkTopicsDialog open={false} {...props} />);
    rerender(<CreateBulkTopicsDialog open {...props} />);
    expect(
      screen.getByLabelText("Cole os tópicos abaixo, um por linha."),
    ).toHaveValue("");
  });
});
