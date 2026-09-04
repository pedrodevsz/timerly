import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { studySessionApi } from "@/services/study-session-service";
import { ManualStudyDialog } from "./manual-study-dialog";

const subjectId = "00000000-0000-4000-8000-000000000010";
const options = [
  {
    id: subjectId,
    name: "Matemática",
    project: { id: "00000000-0000-4000-8000-000000000020", name: "ENEM" },
    topics: [
      { id: 7, name: "Funções", completed: false, subjectId },
      { id: 8, name: "Probabilidade", completed: false, subjectId },
    ],
  },
];

function result(topicCreated = false) {
  return {
    topicCreated,
    session: {
      id: 30,
      status: "COMPLETED" as const,
      startedAt: "2026-09-01T12:00:00.000Z",
      endedAt: "2026-09-01T13:30:00.000Z",
      durationSeconds: 5_400,
      elapsedSeconds: 5_400,
      project: options[0].project,
      subject: { id: subjectId, name: "Matemática" },
      topic: { id: 7, name: "Funções" },
    },
  };
}

describe("ManualStudyDialog", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(studySessionApi, "manualOptions").mockResolvedValue(options);
  });

  it("filtra sem diferenciar maiúsculas e seleciona tópico existente pelo teclado", async () => {
    const createManual = vi
      .spyOn(studySessionApi, "createManual")
      .mockResolvedValue(result());
    const user = userEvent.setup();
    render(<ManualStudyDialog open onOpenChange={vi.fn()} />);

    await user.selectOptions(await screen.findByLabelText("Matéria"), subjectId);
    const topicInput = screen.getByLabelText("Tópico");
    await user.type(topicInput, "FUNÇÕES");
    expect(screen.getByRole("option", { name: "Funções" })).toBeInTheDocument();
    expect(screen.queryByText("novo")).not.toBeInTheDocument();
    await user.keyboard("{ArrowDown}{Enter}");
    expect(screen.getByText("Tópico existente selecionado")).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Horas"));
    await user.type(screen.getByLabelText("Horas"), "1");
    await user.type(screen.getByLabelText("Minutos"), "30");
    await user.click(screen.getByRole("button", { name: "Adicionar estudo" }));

    await waitFor(() =>
      expect(createManual).toHaveBeenCalledWith({
        subjectId,
        topic: { type: "existing", id: 7 },
        studyDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        durationSeconds: 5_400,
      }),
    );
  });

  it("só solicita a criação do novo tópico após seleção explícita e confirmação", async () => {
    const createManual = vi
      .spyOn(studySessionApi, "createManual")
      .mockResolvedValue(result(true));
    const user = userEvent.setup();
    render(<ManualStudyDialog open onOpenChange={vi.fn()} />);

    await user.selectOptions(await screen.findByLabelText("Matéria"), subjectId);
    await user.type(screen.getByLabelText("Tópico"), "Geometria analítica");
    expect(createManual).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole("option", {
        name: "Criar novo tópico: Geometria analítica",
      }),
    );
    expect(screen.getByText("Novo tópico selecionado")).toBeInTheDocument();
    expect(createManual).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText("Minutos"), "45");
    await user.click(screen.getByRole("button", { name: "Adicionar estudo" }));

    await waitFor(() =>
      expect(createManual).toHaveBeenCalledWith(
        expect.objectContaining({
          subjectId,
          topic: { type: "new", name: "Geometria analítica" },
          durationSeconds: 2_700,
        }),
      ),
    );
  });

  it("não mistura tópicos ao trocar de matéria e valida duração", async () => {
    vi.spyOn(studySessionApi, "manualOptions").mockResolvedValue([
      ...options,
      {
        id: "00000000-0000-4000-8000-000000000011",
        name: "História",
        project: options[0].project,
        topics: [
          {
            id: 20,
            name: "Brasil Colônia",
            completed: false,
            subjectId: "00000000-0000-4000-8000-000000000011",
          },
        ],
      },
    ]);
    const user = userEvent.setup();
    render(<ManualStudyDialog open onOpenChange={vi.fn()} />);

    await user.selectOptions(await screen.findByLabelText("Matéria"), subjectId);
    await user.click(screen.getByLabelText("Tópico"));
    expect(screen.getByRole("option", { name: "Funções" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Brasil Colônia" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("option", { name: "Funções" }));
    await user.click(screen.getByRole("button", { name: "Adicionar estudo" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Informe uma duração maior que zero.",
    );
  });
});
