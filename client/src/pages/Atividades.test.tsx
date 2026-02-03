import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import Atividades from "./Atividades";

const toastSpy = vi.fn();

const useAzureContextMock = vi.fn();
const useAtividadesGestaoMock = vi.fn();
const useCriarAtividadeMock = vi.fn();
const useAtualizarAtividadeMock = vi.fn();
const useExcluirAtividadeMock = vi.fn();
const useProjetosMock = vi.fn();
const useSincronizarProjetosMock = vi.fn();

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastSpy }),
}));

vi.mock("@/contexts/AzureDevOpsContext", () => ({
  useAzureContext: () => useAzureContextMock(),
}));

vi.mock("@/hooks/use-atividades", () => ({
  useAtividadesGestao: () => useAtividadesGestaoMock(),
  useCriarAtividade: () => useCriarAtividadeMock(),
  useAtualizarAtividade: () => useAtualizarAtividadeMock(),
  useExcluirAtividade: () => useExcluirAtividadeMock(),
}));

vi.mock("@/hooks/use-projetos", () => ({
  useProjetos: () => useProjetosMock(),
  useSincronizarProjetos: () => useSincronizarProjetosMock(),
}));

vi.mock("@/components/layouts", () => ({
  PageLayout: ({
    title,
    headerContent,
    children,
  }: {
    title: string;
    headerContent?: React.ReactNode;
    children: React.ReactNode;
  }) => (
    <div>
      <h1>{title}</h1>
      {headerContent}
      {children}
    </div>
  ),
}));

vi.mock("@/components/ado", () => ({
  ADOInput: ({
    label,
    placeholder,
    value,
    onChange,
    disabled,
  }: {
    label?: string;
    placeholder?: string;
    value?: string;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    disabled?: boolean;
  }) => (
    <label>
      {label}
      <input
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
    </label>
  ),
  ADOMultiSelect: ({
    label,
    value,
    onChange,
  }: {
    label?: string;
    value?: string[];
    onChange?: (values: string[]) => void;
  }) => (
    <div>
      <span>{label}</span>
      <button type="button" onClick={() => onChange?.([...(value || []), "proj-1"])}>
        Selecionar projeto
      </button>
    </div>
  ),
  ADOTable: ({
    data,
    columns,
    onEdit,
    onDelete,
  }: {
    data: Array<{ id: string; nome: string }>;
    columns: Array<{ key: string; header: string }>;
    onEdit?: (row: { id: string; nome: string }) => void;
    onDelete?: (row: { id: string; nome: string }) => void;
  }) => (
    <div>
      <div>columns:{columns.length}</div>
      {data.map((row) => (
        <div key={row.id}>
          <span>{row.nome}</span>
          <button onClick={() => onEdit?.(row)}>Editar</button>
          <button onClick={() => onDelete?.(row)}>Excluir</button>
        </div>
      ))}
    </div>
  ),
  ADOToolbar: ({
    searchPlaceholder,
    onSearch,
  }: {
    searchPlaceholder?: string;
    onSearch?: (value: string) => void;
  }) => (
    <input
      placeholder={searchPlaceholder}
      onChange={(event) => onSearch?.(event.target.value)}
    />
  ),
  ADOCard: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ADOButton: ({
    children,
    onClick,
    disabled,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  ADOModal: ({
    open,
    title,
    children,
    onConfirm,
    onCancel,
    confirmText = "Salvar",
    cancelText = "Cancelar",
  }: {
    open: boolean;
    title: string;
    children: React.ReactNode;
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
  }) =>
    open ? (
      <div>
        <h2>{title}</h2>
        {children}
        <button onClick={onCancel}>{cancelText}</button>
        <button onClick={onConfirm}>{confirmText}</button>
      </div>
    ) : null,
}));

describe("Atividades", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAzureContextMock.mockReturnValue({ token: "mock-token", isLoading: false });
    useAtividadesGestaoMock.mockReturnValue({
      data: { items: [], total: 0 },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    useCriarAtividadeMock.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    useAtualizarAtividadeMock.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    useExcluirAtividadeMock.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    useProjetosMock.mockReturnValue({ data: { items: [] }, isLoading: false });
    useSincronizarProjetosMock.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
  });

  it("renderiza estado vazio com mensagem de cadastro", () => {
    render(<Atividades />);

    expect(screen.getByText("Gestão de Atividades")).toBeInTheDocument();
    expect(
      screen.getByText("Nenhuma atividade cadastrada. Crie a primeira acima!")
    ).toBeInTheDocument();
  });

  it("renderiza estado de autenticação necessária", () => {
    useAzureContextMock.mockReturnValue({ token: null, isLoading: false });

    render(<Atividades />);

    expect(screen.getByText("Autenticação Necessária")).toBeInTheDocument();
  });

  it("renderiza erro e permite tentar novamente", async () => {
    const refetch = vi.fn();
    useAtividadesGestaoMock.mockReturnValue({
      data: { items: [], total: 0 },
      isLoading: false,
      error: new Error("Falha"),
      refetch,
    });

    render(<Atividades />);

    expect(screen.getByText("Erro ao carregar atividades")).toBeInTheDocument();
    expect(screen.getByText("Falha")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("filtra atividades pelo termo de busca", () => {
    useAtividadesGestaoMock.mockReturnValue({
      data: {
        items: [
          { id: "1", nome: "Documentação", ativo: true },
          { id: "2", nome: "Desenvolvimento", ativo: true },
        ],
        total: 2,
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<Atividades />);

    fireEvent.change(screen.getByPlaceholderText("Pesquisar atividades..."), {
      target: { value: "zzz" },
    });

    expect(
      screen.getByText('Nenhuma atividade encontrada para "zzz".')
    ).toBeInTheDocument();
  });

  it("valida campos obrigatórios antes de salvar", async () => {
    render(<Atividades />);

    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect(toastSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Campo obrigatório",
      })
    );

    fireEvent.change(screen.getByPlaceholderText("Digite o nome da atividade"), {
      target: { value: "Atividade 1" },
    });
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect(toastSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        description: "Por favor, selecione pelo menos um projeto.",
      })
    );
  });

  it("salva nova atividade quando dados válidos", async () => {
    const mutateAsync = vi.fn().mockResolvedValue({});
    useCriarAtividadeMock.mockReturnValue({ mutateAsync, isPending: false });
    useProjetosMock.mockReturnValue({
      data: { items: [{ id: "proj-1", nome: "Projeto 1" }] },
      isLoading: false,
    });

    render(<Atividades />);

    fireEvent.change(screen.getByPlaceholderText("Digite o nome da atividade"), {
      target: { value: "Atividade 1" },
    });
    await userEvent.click(screen.getByRole("button", { name: "Selecionar projeto" }));
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        nome: "Atividade 1",
        ids_projetos: ["proj-1"],
      })
    );
  });

  it("abre modal de edição e salva atualização", async () => {
    const mutateAsync = vi.fn().mockResolvedValue({});
    useAtividadesGestaoMock.mockReturnValue({
      data: {
        items: [
          { id: "1", nome: "Atividade A", ativo: true, projetos: [] },
        ],
        total: 1,
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    useAtualizarAtividadeMock.mockReturnValue({ mutateAsync, isPending: false });

    render(<Atividades />);

    await userEvent.click(screen.getByRole("button", { name: "Editar" }));
    expect(screen.getByText("Editar Atividade")).toBeInTheDocument();

    const nameInputs = screen.getAllByPlaceholderText("Digite o nome da atividade");
    fireEvent.change(nameInputs[nameInputs.length - 1], {
      target: { value: "Atividade Editada" },
    });
    const selectButtons = screen.getAllByRole("button", { name: "Selecionar projeto" });
    await userEvent.click(selectButtons[selectButtons.length - 1]);
    const saveButtons = screen.getAllByRole("button", { name: "Salvar" });
    await userEvent.click(saveButtons[saveButtons.length - 1]);

    expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "1",
        data: expect.objectContaining({
          nome: "Atividade Editada",
          ids_projetos: ["proj-1"],
        }),
      })
    );
  });

  it("abre modal de exclusão e confirma remoção", async () => {
    const mutateAsync = vi.fn().mockResolvedValue({});
    useAtividadesGestaoMock.mockReturnValue({
      data: {
        items: [{ id: "1", nome: "Atividade A", ativo: true, projetos: [] }],
        total: 1,
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    useExcluirAtividadeMock.mockReturnValue({ mutateAsync, isPending: false });

    render(<Atividades />);

    await userEvent.click(screen.getByRole("button", { name: "Excluir" }));
    expect(screen.getByText("Excluir Atividade")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Sim" }));
    expect(mutateAsync).toHaveBeenCalledWith("1");
  });
});
