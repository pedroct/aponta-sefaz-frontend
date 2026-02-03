import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import ConfiguracaoPats from "./ConfiguracaoPats";

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/hooks/use-organization-pats", () => ({
  useOrganizationPats: () => ({ data: { items: [] }, isLoading: false, error: null, refetch: vi.fn() }),
  useCriarOrganizationPat: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useAtualizarOrganizationPat: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useExcluirOrganizationPat: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useValidarPatArmazenado: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useTogglePatAtivo: () => ({ mutateAsync: vi.fn(), isPending: false }),
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
  ADOInput: ({ label }: { label?: string }) => <div>{label}</div>,
  ADOTable: ({ emptyText }: { emptyText: string }) => <div>{emptyText}</div>,
  ADOCard: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ADOButton: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
  ADOModal: ({ open, title, children }: { open: boolean; title: string; children: React.ReactNode }) =>
    open ? (
      <div>
        <h2>{title}</h2>
        {children}
      </div>
    ) : null,
}));

describe("ConfiguracaoPats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
