import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import ConfiguracaoPats from "./ConfiguracaoPats";

const toastSpy = vi.fn();

const useOrganizationPatsMock = vi.fn();
const useCriarOrganizationPatMock = vi.fn();
const useAtualizarOrganizationPatMock = vi.fn();
const useExcluirOrganizationPatMock = vi.fn();
const useValidarPatArmazenadoMock = vi.fn();
const useTogglePatAtivoMock = vi.fn();

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastSpy }),
}));

vi.mock("@/hooks/use-organization-pats", () => ({
  useOrganizationPats: () => useOrganizationPatsMock(),
  useCriarOrganizationPat: () => useCriarOrganizationPatMock(),
  useAtualizarOrganizationPat: () => useAtualizarOrganizationPatMock(),
  useExcluirOrganizationPat: () => useExcluirOrganizationPatMock(),
  useValidarPatArmazenado: () => useValidarPatArmazenadoMock(),
  useTogglePatAtivo: () => useTogglePatAtivoMock(),
}));

vi.mock("@/components/layouts", () => ({
  PageLayout: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

vi.mock("@/components/ado", () => ({
  ADOInput: ({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
    disabled,
  }: {
    label?: string;
    value?: string;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    type?: string;
    disabled?: boolean;
  }) => (
    <label>
      {label}
      <input
        aria-label={label}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        type={type}
        disabled={disabled}
      />
    </label>
  ),
  ADOTable: ({
    data,
    columns,
    emptyText,
  }: {
    data: Array<Record<string, string | boolean>>;
    columns: Array<{ key: string; header: string; render?: (row: any) => React.ReactNode }>;
    emptyText: string;
  }) => (
    <div>
      {data.length === 0 ? (
        <div>{emptyText}</div>
      ) : (
        data.map((row, index) => (
          <div key={row.id || index}>
            {columns.map((col) => (
              <span key={`${col.key}-${index}`}>
                {col.render ? col.render(row) : String(row[col.key])}
              </span>
            ))}
          </div>
        ))
      )}
    </div>
  ),
  ADOCard: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ADOButton: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => <button onClick={onClick}>{children}</button>,
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

describe("ConfiguracaoPats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useOrganizationPatsMock.mockReturnValue({
      data: { items: [] },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    useCriarOrganizationPatMock.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    useAtualizarOrganizationPatMock.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    useExcluirOrganizationPatMock.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    useValidarPatArmazenadoMock.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    useTogglePatAtivoMock.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
  });

  it("renderiza estado vazio com mensagem", () => {
    render(<ConfiguracaoPats />);

    expect(screen.getByText("Configuração de PATs")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Nenhum PAT cadastrado. Clique em 'Novo PAT' para começar."
      )
    ).toBeInTheDocument();
  });

  it("abre modal ao clicar em Novo PAT", () => {
    render(<ConfiguracaoPats />);

    fireEvent.click(screen.getByText("Novo PAT"));

    expect(screen.getByText("Novo PAT de Organização")).toBeInTheDocument();
  });

  it("renderiza erro ao carregar", () => {
    useOrganizationPatsMock.mockReturnValue({
      data: { items: [] },
      isLoading: false,
      error: new Error("Falha"),
      refetch: vi.fn(),
    });

    render(<ConfiguracaoPats />);

    expect(screen.getByText("Erro ao carregar PATs: Falha")).toBeInTheDocument();
  });

  it("cria PAT ao submeter formulário", async () => {
    const mutateAsync = vi.fn().mockResolvedValue({});
    useCriarOrganizationPatMock.mockReturnValue({ mutateAsync, isPending: false });

    render(<ConfiguracaoPats />);

    await userEvent.click(screen.getByText("Novo PAT"));

    fireEvent.change(screen.getByLabelText("Nome da Organização"), {
      target: { value: "org-1" },
    });
    fireEvent.change(screen.getByLabelText("PAT"), {
      target: { value: "token-123" },
    });

    await userEvent.click(screen.getByRole("button", { name: "Criar PAT" }));

    expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_name: "org-1",
        pat: "token-123",
        validate_first: true,
      })
    );
  });

  it("executa ações de validar e alternar status", async () => {
    const validar = vi.fn().mockResolvedValue({ valid: true, projects_count: 1, projects: ["P1"] });
    const toggle = vi.fn().mockResolvedValue({});
    useValidarPatArmazenadoMock.mockReturnValue({ mutateAsync: validar, isPending: false });
    useTogglePatAtivoMock.mockReturnValue({ mutateAsync: toggle, isPending: false });
    useOrganizationPatsMock.mockReturnValue({
      data: {
        items: [
          {
            id: "pat-1",
            organization_name: "Org",
            pat_masked: "***",
            ativo: true,
          },
        ],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ConfiguracaoPats />);

    await userEvent.click(screen.getByTitle("Validar PAT"));
    expect(validar).toHaveBeenCalledWith("pat-1");

    await userEvent.click(screen.getByTitle("Desativar"));
    expect(toggle).toHaveBeenCalledWith("pat-1");
  });

  it("edita e exclui PAT com modais", async () => {
    const atualizar = vi.fn().mockResolvedValue({});
    const excluir = vi.fn().mockResolvedValue({});
    useAtualizarOrganizationPatMock.mockReturnValue({ mutateAsync: atualizar, isPending: false });
    useExcluirOrganizationPatMock.mockReturnValue({ mutateAsync: excluir, isPending: false });
    useOrganizationPatsMock.mockReturnValue({
      data: {
        items: [
          {
            id: "pat-2",
            organization_name: "Org 2",
            pat_masked: "***",
            ativo: true,
            organization_url: "https://dev.azure.com/org2",
            descricao: "desc",
          },
        ],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ConfiguracaoPats />);

    await userEvent.click(screen.getByTitle("Editar"));
    expect(screen.getByText("Editar PAT")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect(atualizar).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "pat-2",
        data: expect.any(Object),
      })
    );

    await userEvent.click(screen.getByTitle("Excluir"));
    expect(screen.getByText("Confirmar Exclusão")).toBeInTheDocument();
    const deleteButtons = screen.getAllByRole("button", { name: "Excluir" });
    await userEvent.click(deleteButtons[deleteButtons.length - 1]);
    expect(excluir).toHaveBeenCalledWith("pat-2");
  });
});
