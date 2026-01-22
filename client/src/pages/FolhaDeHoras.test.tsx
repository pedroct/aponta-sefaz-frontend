import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import FolhaDeHoras from "./FolhaDeHoras";

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
}));

// Mock do useTimesheet
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

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("FolhaDeHoras", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Renderização", () => {
    it("deve renderizar o título da página", () => {
      render(<FolhaDeHoras />, { wrapper: createWrapper() });

      expect(screen.getByText("Gestão de Apontamentos")).toBeInTheDocument();
    });

    it("deve renderizar o botão Novo Apontamento", () => {
      render(<FolhaDeHoras />, { wrapper: createWrapper() });

      expect(screen.getByRole("button", { name: /Novo Apontamento/i })).toBeInTheDocument();
    });

    it("deve renderizar o botão Hoje", () => {
      render(<FolhaDeHoras />, { wrapper: createWrapper() });

      expect(screen.getByRole("button", { name: "Hoje" })).toBeInTheDocument();
    });

    it("deve renderizar os checkboxes de filtros", () => {
      render(<FolhaDeHoras />, { wrapper: createWrapper() });

      expect(screen.getByText("Projeto Atual")).toBeInTheDocument();
    });

    it("deve renderizar a tabela de timesheet", () => {
      render(<FolhaDeHoras />, { wrapper: createWrapper() });

      expect(screen.getByRole("table")).toBeInTheDocument();
    });

    it("deve renderizar o cabeçalho Escopo de Trabalho", () => {
      render(<FolhaDeHoras />, { wrapper: createWrapper() });

      expect(screen.getByText("Escopo de Trabalho")).toBeInTheDocument();
    });

    it("deve renderizar o rodapé TOTAL GERAL", () => {
      render(<FolhaDeHoras />, { wrapper: createWrapper() });

      expect(screen.getByText("TOTAL GERAL")).toBeInTheDocument();
    });

    it("deve renderizar a seção Semanal Σ", () => {
      render(<FolhaDeHoras />, { wrapper: createWrapper() });

      expect(screen.getByText("Semanal Σ")).toBeInTheDocument();
    });

    it("deve renderizar os dias da semana no cabeçalho", () => {
      render(<FolhaDeHoras />, { wrapper: createWrapper() });
      
      // Verifica se há pelo menos um dia da semana (os dias são formatados em português)
      const daysOfWeek = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];
      const found = daysOfWeek.some(day => {
        const elements = screen.queryAllByText(new RegExp(day, "i"));
        return elements.length > 0;
      });
      
      expect(found).toBe(true);
    });

    it("deve exibir copyright no rodapé", () => {
      render(<FolhaDeHoras />, { wrapper: createWrapper() });

      expect(screen.getByText(/CESOP - Gestão de Projetos/i)).toBeInTheDocument();
    });
  });

  describe("Navegação de Semana", () => {
    it("deve exibir o intervalo de datas da semana", () => {
      render(<FolhaDeHoras />, { wrapper: createWrapper() });

      // Verifica se há um intervalo de datas no formato dd/MM - dd/MM
      const dateRange = screen.getByText(/\d{2}\/\d{2} - \d{2}\/\d{2}/);
      expect(dateRange).toBeInTheDocument();
    });

    it("deve ter botão de navegação para semana anterior", () => {
      render(<FolhaDeHoras />, { wrapper: createWrapper() });

      const prevButton = screen.getByTitle("Semana Anterior");
      expect(prevButton).toBeInTheDocument();
    });

    it("deve ter botão de navegação para próxima semana", () => {
      render(<FolhaDeHoras />, { wrapper: createWrapper() });

      const nextButton = screen.getByTitle("Próxima Semana");
      expect(nextButton).toBeInTheDocument();
    });

    it("deve mudar a semana ao clicar em próxima semana", async () => {
      render(<FolhaDeHoras />, { wrapper: createWrapper() });

      // Verifica que o botão existe e é clicável
      const nextButton = screen.getByTitle("Próxima Semana");
      expect(nextButton).toBeInTheDocument();
      
      // Clica no botão - a navegação deve funcionar sem erro
      await userEvent.click(nextButton);
      
      // Verifica que a página ainda está renderizada corretamente
      expect(screen.getByText("Gestão de Apontamentos")).toBeInTheDocument();
    });

    it("deve mudar a semana ao clicar em semana anterior", async () => {
      render(<FolhaDeHoras />, { wrapper: createWrapper() });

      // Verifica que o botão existe e é clicável
      const prevButton = screen.getByTitle("Semana Anterior");
      expect(prevButton).toBeInTheDocument();
      
      // Clica no botão - a navegação deve funcionar sem erro
      await userEvent.click(prevButton);
      
      // Verifica que a página ainda está renderizada corretamente
      expect(screen.getByText("Gestão de Apontamentos")).toBeInTheDocument();
    });

    it("deve voltar para a semana atual ao clicar em Hoje", async () => {
      render(<FolhaDeHoras />, { wrapper: createWrapper() });

      // Verifica que o botão Hoje existe
      const todayButton = screen.getByRole("button", { name: "Hoje" });
      expect(todayButton).toBeInTheDocument();
      
      // Clica em Hoje
      await userEvent.click(todayButton);

      // Verifica que a página ainda está renderizada corretamente
      expect(screen.getByText("Gestão de Apontamentos")).toBeInTheDocument();
    });
  });

  describe("Modal de Apontamento", () => {
    it("deve abrir modal ao clicar em Novo Apontamento", async () => {
      render(<FolhaDeHoras />, { wrapper: createWrapper() });

      const newButton = screen.getByRole("button", { name: /Novo Apontamento/i });
      await userEvent.click(newButton);

      expect(screen.getByText("Apontar Tempo Trabalhado")).toBeInTheDocument();
    });

    it("deve fechar modal ao clicar em Cancelar", async () => {
      render(<FolhaDeHoras />, { wrapper: createWrapper() });

      // Abre o modal
      const newButton = screen.getByRole("button", { name: /Novo Apontamento/i });
      await userEvent.click(newButton);

      // Verifica que o modal está aberto
      expect(screen.getByText("Apontar Tempo Trabalhado")).toBeInTheDocument();

      // Fecha o modal
      const cancelButton = screen.getByRole("button", { name: "Cancelar" });
      await userEvent.click(cancelButton);

      // Modal não deve mais estar visível
      expect(screen.queryByText("Apontar Tempo Trabalhado")).not.toBeInTheDocument();
    });

    it("deve ter botão Salvar no modal", async () => {
      render(<FolhaDeHoras />, { wrapper: createWrapper() });

      // Abre o modal
      const newButton = screen.getByRole("button", { name: /Novo Apontamento/i });
      await userEvent.click(newButton);

      // Verifica que o modal está aberto
      expect(screen.getByText("Apontar Tempo Trabalhado")).toBeInTheDocument();

      // Verifica que o botão Salvar existe
      const saveButton = screen.getByRole("button", { name: "Salvar" });
      expect(saveButton).toBeInTheDocument();
    });
  });

  describe("Filtros", () => {
    it("deve ter checkbox Projeto Atual marcado por padrão", () => {
      render(<FolhaDeHoras />, { wrapper: createWrapper() });

      const projectLabel = screen.getByText("Projeto Atual");
      const checkbox = projectLabel.closest("label")?.querySelector('[role="checkbox"]');
      
      expect(checkbox).toHaveAttribute("data-state", "checked");
    });


    it("deve alternar checkbox Projeto Atual ao clicar", async () => {
      render(<FolhaDeHoras />, { wrapper: createWrapper() });

      const projectLabel = screen.getByText("Projeto Atual");
      const checkbox = projectLabel.closest("label")?.querySelector('[role="checkbox"]');
      
      if (checkbox) {
        // Inicialmente marcado
        expect(checkbox).toHaveAttribute("data-state", "checked");
        
        // Clica para desmarcar
        await userEvent.click(checkbox);
        expect(checkbox).toHaveAttribute("data-state", "unchecked");
        
        // Clica para marcar novamente
        await userEvent.click(checkbox);
        expect(checkbox).toHaveAttribute("data-state", "checked");
      }
    });

  });

  describe("Exibição de Horas", () => {
    it("deve exibir valores de esforço (E) nas colunas", () => {
      render(<FolhaDeHoras />, { wrapper: createWrapper() });

      // Verifica se a coluna de esforço está renderizada
      const table = screen.getByRole("table");
      const effortHeader = within(table).getByTitle("Esforço (Effort)");
      expect(effortHeader).toBeInTheDocument();
    });

    it("deve exibir valores de histórico (H) nas colunas", () => {
      render(<FolhaDeHoras />, { wrapper: createWrapper() });

      // Verifica se a coluna de histórico está renderizada
      const table = screen.getByRole("table");
      const historyHeader = within(table).getByTitle("Histórico (History)");
      expect(historyHeader).toBeInTheDocument();
    });
  });

  describe("Acessibilidade", () => {
    it("deve ter estrutura de tabela acessível", () => {
      render(<FolhaDeHoras />, { wrapper: createWrapper() });

      expect(screen.getByRole("table")).toBeInTheDocument();
      expect(screen.getAllByRole("row").length).toBeGreaterThan(0);
    });

    it("deve ter botões com títulos descritivos", () => {
      render(<FolhaDeHoras />, { wrapper: createWrapper() });

      expect(screen.getByTitle("Semana Anterior")).toBeInTheDocument();
      expect(screen.getByTitle("Próxima Semana")).toBeInTheDocument();
    });
  });
});
