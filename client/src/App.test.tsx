import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

// Mock do useAzureDevOps
vi.mock("@/hooks/use-azure-devops", () => ({
  useAzureDevOps: () => ({
    isInAzureDevOps: false,
    isLoading: false,
    context: {
      organization: "test-org",
      project: "test-project",
      projectId: "test-project-id",
    },
    token: "test-token",
    refreshToken: vi.fn().mockResolvedValue("test-token"),
    error: null,
  }),
}));

// Mock do useTimesheet para retornar dados com estrutura correta
vi.mock("@/hooks/use-timesheet", () => ({
  useTimesheet: () => ({
    data: {
      semana_inicio: "2025-01-20",
      semana_fim: "2025-01-26",
      semana_label: "20/01 - 26/01",
      work_items: [
        {
          id: 123,
          title: "Task de exemplo",
          type: "Task",
          state: "Active",
          state_category: "InProgress",
          icon_url: "https://example.com/task.png",
          assigned_to: "Test User",
          original_estimate: 8,
          completed_work: 4,
          remaining_work: 4,
          total_semana_horas: 4,
          total_semana_formatado: "04:00",
          dias: [
            { data: "2025-01-20", dia_semana: "seg", dia_numero: 20, total_horas: 4, total_formatado: "04:00", apontamentos: [], eh_hoje: true, eh_fim_semana: false },
            { data: "2025-01-21", dia_semana: "ter", dia_numero: 21, total_horas: 0, total_formatado: "", apontamentos: [], eh_hoje: false, eh_fim_semana: false },
            { data: "2025-01-22", dia_semana: "qua", dia_numero: 22, total_horas: 0, total_formatado: "", apontamentos: [], eh_hoje: false, eh_fim_semana: false },
            { data: "2025-01-23", dia_semana: "qui", dia_numero: 23, total_horas: 0, total_formatado: "", apontamentos: [], eh_hoje: false, eh_fim_semana: false },
            { data: "2025-01-24", dia_semana: "sex", dia_numero: 24, total_horas: 0, total_formatado: "", apontamentos: [], eh_hoje: false, eh_fim_semana: false },
            { data: "2025-01-25", dia_semana: "sab", dia_numero: 25, total_horas: 0, total_formatado: "", apontamentos: [], eh_hoje: false, eh_fim_semana: true },
            { data: "2025-01-26", dia_semana: "dom", dia_numero: 26, total_horas: 0, total_formatado: "", apontamentos: [], eh_hoje: false, eh_fim_semana: true },
          ],
          nivel: 3,
          parent_id: null,
          children: [],
          pode_editar: true,
          pode_excluir: true,
        },
      ],
      total_geral_horas: 4,
      total_geral_formatado: "04:00",
      totais_por_dia: [
        { dia: "2025-01-20", dia_semana: "Seg", total_horas: 4, total_formatado: "04:00" },
        { dia: "2025-01-21", dia_semana: "Ter", total_horas: 0, total_formatado: "00:00" },
        { dia: "2025-01-22", dia_semana: "Qua", total_horas: 0, total_formatado: "00:00" },
        { dia: "2025-01-23", dia_semana: "Qui", total_horas: 0, total_formatado: "00:00" },
        { dia: "2025-01-24", dia_semana: "Sex", total_horas: 0, total_formatado: "00:00" },
        { dia: "2025-01-25", dia_semana: "Sáb", total_horas: 0, total_formatado: "00:00" },
        { dia: "2025-01-26", dia_semana: "Dom", total_horas: 0, total_formatado: "00:00" },
      ],
      total_work_items: 1,
      total_esforco: 8,
      total_historico: 4,
    },
    isLoading: false,
    isError: false,
    error: null,
  }),
  useInvalidateTimesheet: () => ({
    invalidate: vi.fn(),
    invalidateForWeek: vi.fn(),
  }),
}));

// Mock do useAzureContext
vi.mock("@/contexts/AzureDevOpsContext", () => ({
  useAzureContext: () => ({
    api: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
    },
    organization: "test-org",
    project: "test-project",
    isLoading: false,
    isInAzureDevOps: false,
  }),
  useAzureContextOptional: () => ({
    api: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
    },
    organization: "test-org",
    project: "test-project",
    isLoading: false,
    isInAzureDevOps: false,
  }),
  AzureDevOpsProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock dos hooks usados pelo ModalAdicionarTempo e DialogConfirmarExclusao
vi.mock("@/hooks/use-api", () => ({
  useCriarApontamento: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ id: "test-id" }),
    isPending: false,
  }),
  useAtualizarApontamento: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ id: "test-id" }),
    isPending: false,
  }),
  useExcluirApontamento: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  }),
  useDeletarApontamento: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  }),
}));

vi.mock("@/hooks/use-current-user", () => ({
  useCurrentUser: () => ({
    data: {
      id: "test-user-id",
      displayName: "Test User",
      emailAddress: "test@example.com",
    },
    isLoading: false,
  }),
}));

vi.mock("@/hooks/use-search-work-items", () => ({
  useSearchWorkItems: () => ({
    results: [],
    isLoading: false,
    handleSearch: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-atividades", () => ({
  useAtividades: () => ({
    data: {
      items: [
        { id: "ativ-1", nome: "Desenvolvimento", ativo: true },
        { id: "ativ-2", nome: "Documentação", ativo: true },
      ],
      total: 2,
    },
    isLoading: false,
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
  useToast: () => ({
    toasts: [],
    toast: vi.fn(),
    dismiss: vi.fn(),
  }),
}));

describe("App", () => {
  describe("Renderização Principal", () => {
    it("renderiza a página FolhaDeHoras como rota principal", () => {
      render(<App />);

      expect(screen.getByText("Gestão de Apontamentos")).toBeInTheDocument();
    });

    it("renderiza o botão Novo Apontamento", () => {
      render(<App />);

      expect(screen.getByRole("button", { name: /Novo Apontamento/i })).toBeInTheDocument();
    });

    it("renderiza o botão Hoje", () => {
      render(<App />);

      expect(screen.getByRole("button", { name: "Hoje" })).toBeInTheDocument();
    });

    it("renderiza a tabela de timesheet", () => {
      render(<App />);

      expect(screen.getByRole("table")).toBeInTheDocument();
    });

    it("renderiza os filtros de projeto", () => {
      render(<App />);

      expect(screen.getByText("Projeto Atual")).toBeInTheDocument();
      expect(screen.getByText("Somente meus itens")).toBeInTheDocument();
    });
  });

  describe("Modal de Apontamento", () => {
    it("abre o modal ao clicar em Novo Apontamento", async () => {
      render(<App />);

      const newButton = screen.getByRole("button", { name: /Novo Apontamento/i });
      await userEvent.click(newButton);

      expect(screen.getByText("Apontar Tempo Trabalhado")).toBeInTheDocument();
    });

    it("modal tem botão Salvar", async () => {
      render(<App />);

      const newButton = screen.getByRole("button", { name: /Novo Apontamento/i });
      await userEvent.click(newButton);

      expect(screen.getByRole("button", { name: "Salvar" })).toBeInTheDocument();
    });

    it("modal tem botão Cancelar", async () => {
      render(<App />);

      const newButton = screen.getByRole("button", { name: /Novo Apontamento/i });
      await userEvent.click(newButton);

      expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument();
    });

    it("fecha o modal ao clicar em Cancelar", async () => {
      render(<App />);

      // Abre o modal
      const newButton = screen.getByRole("button", { name: /Novo Apontamento/i });
      await userEvent.click(newButton);

      // Verifica que abriu
      expect(screen.getByText("Apontar Tempo Trabalhado")).toBeInTheDocument();

      // Fecha
      const cancelButton = screen.getByRole("button", { name: "Cancelar" });
      await userEvent.click(cancelButton);

      // Verifica que fechou
      expect(screen.queryByText("Apontar Tempo Trabalhado")).not.toBeInTheDocument();
    });
  });

  describe("Navegação", () => {
    it("tem botões de navegação de semana", () => {
      render(<App />);

      expect(screen.getByTitle("Semana Anterior")).toBeInTheDocument();
      expect(screen.getByTitle("Próxima Semana")).toBeInTheDocument();
    });

    it("exibe intervalo de datas da semana", () => {
      render(<App />);

      // Verifica se há um intervalo de datas no formato dd/MM - dd/MM
      const dateRange = screen.getByText(/\d{2}\/\d{2} - \d{2}\/\d{2}/);
      expect(dateRange).toBeInTheDocument();
    });
  });
});
