import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import Atividades from "./Atividades";

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/contexts/AzureDevOpsContext", () => ({
  useAzureContext: () => ({ token: "mock-token", isLoading: false }),
}));

vi.mock("@/hooks/use-atividades", () => ({
  useAtividadesGestao: () => ({
    data: { items: [], total: 0 },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
  useCriarAtividade: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useAtualizarAtividade: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useExcluirAtividade: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@/hooks/use-projetos", () => ({
  useProjetos: () => ({ data: { items: [] }, isLoading: false }),
  useSincronizarProjetos: () => ({ mutateAsync: vi.fn(), isPending: false }),
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
  ADOInput: (props: { label?: string }) => (
    <div data-testid="ado-input">{props.label}</div>
  ),
  ADOMultiSelect: () => <div data-testid="ado-multi" />,
  ADOTable: () => <div data-testid="ado-table" />,
  ADOToolbar: () => <div data-testid="ado-toolbar" />,
  ADOCard: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ADOButton: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  ADOModal: ({ open, title }: { open: boolean; title: string }) =>
    open ? <div>{title}</div> : null,
}));

describe("Atividades", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza estado vazio com mensagem de cadastro", () => {
    render(<Atividades />);

    expect(screen.getByText("Gestão de Atividades")).toBeInTheDocument();
    expect(
      screen.getByText("Nenhuma atividade cadastrada. Crie a primeira acima!")
    ).toBeInTheDocument();
  });
});
