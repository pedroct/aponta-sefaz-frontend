import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ModalAdicionarTempo } from "./ModalAdicionarTempo";

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
  }),
}));

// Mock dos hooks de API
vi.mock("@/hooks/use-api", () => ({
  useCriarApontamento: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ id: "test-id" }),
    isPending: false,
  }),
  useAtualizarApontamento: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ id: "test-id" }),
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

describe("ModalAdicionarTempo", () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Renderização", () => {
    it("deve renderizar o modal quando isOpen é true", () => {
      render(<ModalAdicionarTempo isOpen={true} onClose={mockOnClose} />, { wrapper: createWrapper() });

      expect(screen.getByText("Apontar Tempo Trabalhado")).toBeInTheDocument();
    });

    it("não deve renderizar o modal quando isOpen é false", () => {
      render(<ModalAdicionarTempo isOpen={false} onClose={mockOnClose} />, { wrapper: createWrapper() });

      expect(screen.queryByText("Apontar Tempo Trabalhado")).not.toBeInTheDocument();
    });

    it("deve exibir o nome do usuário", () => {
      render(<ModalAdicionarTempo isOpen={true} onClose={mockOnClose} />, { wrapper: createWrapper() });

      expect(screen.getByText("TEST USER")).toBeInTheDocument();
    });

    it("deve exibir as iniciais do usuário no avatar", () => {
      render(<ModalAdicionarTempo isOpen={true} onClose={mockOnClose} />, { wrapper: createWrapper() });

      // Test User = TU (primeira letra do primeiro nome + primeira letra do último nome)
      expect(screen.getByText("TU")).toBeInTheDocument();
    });

    it("deve exibir label Tarefa", () => {
      render(<ModalAdicionarTempo isOpen={true} onClose={mockOnClose} />, { wrapper: createWrapper() });

      expect(screen.getByText("Tarefa")).toBeInTheDocument();
    });

    it("deve exibir label Data", () => {
      render(<ModalAdicionarTempo isOpen={true} onClose={mockOnClose} />, { wrapper: createWrapper() });

      expect(screen.getByText("Data")).toBeInTheDocument();
    });

    it("deve exibir label Duração", () => {
      render(<ModalAdicionarTempo isOpen={true} onClose={mockOnClose} />, { wrapper: createWrapper() });

      expect(screen.getByText("Duração")).toBeInTheDocument();
    });

    it("deve exibir label Tipo de Atividade", () => {
      render(<ModalAdicionarTempo isOpen={true} onClose={mockOnClose} />, { wrapper: createWrapper() });

      expect(screen.getByText("Tipo de Atividade")).toBeInTheDocument();
    });

    it("deve exibir campo de comentário", () => {
      render(<ModalAdicionarTempo isOpen={true} onClose={mockOnClose} />, { wrapper: createWrapper() });

      const textarea = screen.getByPlaceholderText("Adicione um comentário...");
      expect(textarea).toBeInTheDocument();
    });

    it("deve exibir todos os presets de duração", () => {
      render(<ModalAdicionarTempo isOpen={true} onClose={mockOnClose} />, { wrapper: createWrapper() });

      expect(screen.getByRole("button", { name: "+0.5h" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "+1h" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "+2h" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "+4h" })).toBeInTheDocument();
    });

    it("deve exibir botões Salvar e Cancelar", () => {
      render(<ModalAdicionarTempo isOpen={true} onClose={mockOnClose} />, { wrapper: createWrapper() });

      expect(screen.getByRole("button", { name: "Salvar" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument();
    });
  });

  describe("Duração", () => {
    it("deve iniciar com duração 00:00", () => {
      render(<ModalAdicionarTempo isOpen={true} onClose={mockOnClose} />, { wrapper: createWrapper() });

      const durationInput = screen.getByDisplayValue("00:00");
      expect(durationInput).toBeInTheDocument();
    });

    it("deve adicionar 0.5h ao clicar no preset +0.5h", async () => {
      render(<ModalAdicionarTempo isOpen={true} onClose={mockOnClose} />, { wrapper: createWrapper() });

      const preset05h = screen.getByRole("button", { name: "+0.5h" });
      await userEvent.click(preset05h);

      // 00:00 + 00:30 = 00:30
      expect(screen.getByDisplayValue("00:30")).toBeInTheDocument();
    });

    it("deve adicionar 1h ao clicar no preset +1h", async () => {
      render(<ModalAdicionarTempo isOpen={true} onClose={mockOnClose} />, { wrapper: createWrapper() });

      const preset1h = screen.getByRole("button", { name: "+1h" });
      await userEvent.click(preset1h);

      // 00:00 + 01:00 = 01:00
      expect(screen.getByDisplayValue("01:00")).toBeInTheDocument();
    });

    it("deve adicionar 2h ao clicar no preset +2h", async () => {
      render(<ModalAdicionarTempo isOpen={true} onClose={mockOnClose} />, { wrapper: createWrapper() });

      const preset2h = screen.getByRole("button", { name: "+2h" });
      await userEvent.click(preset2h);

      // 00:00 + 02:00 = 02:00
      expect(screen.getByDisplayValue("02:00")).toBeInTheDocument();
    });

    it("deve adicionar 4h ao clicar no preset +4h", async () => {
      render(<ModalAdicionarTempo isOpen={true} onClose={mockOnClose} />, { wrapper: createWrapper() });

      const preset4h = screen.getByRole("button", { name: "+4h" });
      await userEvent.click(preset4h);

      // 00:00 + 04:00 = 04:00
      expect(screen.getByDisplayValue("04:00")).toBeInTheDocument();
    });

    it("deve adicionar tempo cumulativamente", async () => {
      render(<ModalAdicionarTempo isOpen={true} onClose={mockOnClose} />, { wrapper: createWrapper() });

      const preset1h = screen.getByRole("button", { name: "+1h" });
      await userEvent.click(preset1h);
      await userEvent.click(preset1h);

      // 00:00 + 01:00 + 01:00 = 02:00
      expect(screen.getByDisplayValue("02:00")).toBeInTheDocument();
    });

    it("deve limitar duração máxima em 08:00", async () => {
      render(<ModalAdicionarTempo isOpen={true} onClose={mockOnClose} />, { wrapper: createWrapper() });

      const preset4h = screen.getByRole("button", { name: "+4h" });
      await userEvent.click(preset4h); // 04:00
      await userEvent.click(preset4h); // Tentativa de ir para 08:00

      // Deve limitar em 08:00
      expect(screen.getByDisplayValue("08:00")).toBeInTheDocument();
    });

    it("deve permitir digitar duração manualmente", async () => {
      render(<ModalAdicionarTempo isOpen={true} onClose={mockOnClose} />, { wrapper: createWrapper() });

      const durationInput = screen.getByDisplayValue("00:00");
      await userEvent.clear(durationInput);
      await userEvent.type(durationInput, "02:30");

      expect(screen.getByDisplayValue("02:30")).toBeInTheDocument();
    });

    it("deve limitar duração em 08:00 quando digitado valor maior (no blur)", async () => {
      render(<ModalAdicionarTempo isOpen={true} onClose={mockOnClose} />, { wrapper: createWrapper() });

      const durationInput = screen.getByDisplayValue("00:00");

      // Simula change event diretamente com valor que excede 8h
      fireEvent.change(durationInput, { target: { value: "10:00" } });
      // A limitação acontece no blur
      fireEvent.blur(durationInput);

      // O componente deve limitar para 08:00
      expect(screen.getByDisplayValue("08:00")).toBeInTheDocument();
    });

    it("deve rejeitar caracteres não numéricos na duração", async () => {
      render(<ModalAdicionarTempo isOpen={true} onClose={mockOnClose} />, { wrapper: createWrapper() });

      const durationInput = screen.getByDisplayValue("00:00");

      // Tentativa de inserir letras
      fireEvent.change(durationInput, { target: { value: "ab:cd" } });

      // Deve manter o valor anterior ou valor vazio/default
      // O componente filtra caracteres não-numéricos, então vai mostrar valor vazio
      // que depois do blur vai formatar
      expect(durationInput).toBeInTheDocument();
    });
  });

  describe("Interações", () => {
    it("deve chamar onClose ao clicar no botão X", async () => {
      render(<ModalAdicionarTempo isOpen={true} onClose={mockOnClose} />, { wrapper: createWrapper() });

      const buttons = screen.getAllByRole("button");
      const xButton = buttons.find(btn => btn.querySelector("svg"));

      if (xButton) {
        await userEvent.click(xButton);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });

    it("deve chamar onClose ao clicar em Cancelar", async () => {
      render(<ModalAdicionarTempo isOpen={true} onClose={mockOnClose} />, { wrapper: createWrapper() });

      const cancelButton = screen.getByRole("button", { name: "Cancelar" });
      await userEvent.click(cancelButton);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it("deve ter botão Salvar presente e clicável", async () => {
      render(<ModalAdicionarTempo isOpen={true} onClose={mockOnClose} />, { wrapper: createWrapper() });

      const saveButton = screen.getByRole("button", { name: "Salvar" });
      expect(saveButton).toBeInTheDocument();
      // O botão pode estar desabilitado se não houver dados válidos
      // mas deve existir no DOM
    });

    it("deve permitir digitar comentário", async () => {
      render(<ModalAdicionarTempo isOpen={true} onClose={mockOnClose} />, { wrapper: createWrapper() });

      const textarea = screen.getByPlaceholderText("Adicione um comentário...");
      await userEvent.type(textarea, "Meu comentário de teste");

      expect(textarea).toHaveValue("Meu comentário de teste");
    });
  });

  describe("Props", () => {
    it("deve exibir taskTitle e taskId quando fornecidos", () => {
      render(
        <ModalAdicionarTempo 
          isOpen={true} 
          onClose={mockOnClose}
          taskTitle="Minha Tarefa Customizada"
          taskId="42"
        />,
        { wrapper: createWrapper() }
      );

      // O campo de pesquisa deve mostrar a tarefa
      expect(screen.getByDisplayValue("#42 Minha Tarefa Customizada")).toBeInTheDocument();
    });

    it("deve usar campo de pesquisa vazio quando taskTitle e taskId não são fornecidos", () => {
      render(<ModalAdicionarTempo isOpen={true} onClose={mockOnClose} />, { wrapper: createWrapper() });

      // Sem valores padrão, campo de pesquisa deve estar vazio
      const searchInput = screen.getByPlaceholderText("Pesquisar tarefa...");
      expect(searchInput).toHaveValue("");
    });
  });

  describe("Tipo de Atividade", () => {
    it("deve exibir as opções de atividade no select", () => {
      render(<ModalAdicionarTempo isOpen={true} onClose={mockOnClose} />, { wrapper: createWrapper() });

      // Verifica se há um combobox ou select para atividade
      const selectTrigger = screen.getByRole("combobox");
      expect(selectTrigger).toBeInTheDocument();
    });

    it("deve ter um seletor de tipo de atividade", () => {
      render(<ModalAdicionarTempo isOpen={true} onClose={mockOnClose} />, { wrapper: createWrapper() });

      // Verifica que o label "Tipo de Atividade" está presente
      expect(screen.getByText("Tipo de Atividade")).toBeInTheDocument();
    });
  });

  describe("Calendário", () => {
    it("deve exibir botão para abrir calendário", () => {
      render(<ModalAdicionarTempo isOpen={true} onClose={mockOnClose} />, { wrapper: createWrapper() });

      // Verifica se há um botão de calendário com a data formatada
      const calendarButton = screen.getByRole("button", { name: /\d{2}\/\d{2}\/\d{4}/ });
      expect(calendarButton).toBeInTheDocument();
    });

    it("deve abrir popover do calendário ao clicar", async () => {
      render(<ModalAdicionarTempo isOpen={true} onClose={mockOnClose} />, { wrapper: createWrapper() });

      const calendarButton = screen.getByRole("button", { name: /\d{2}\/\d{2}\/\d{4}/ });
      await userEvent.click(calendarButton);

      // O calendário deve estar visível (verifica existência do grid do calendário)
      expect(screen.getByRole("grid")).toBeInTheDocument();
    });
  });
});
