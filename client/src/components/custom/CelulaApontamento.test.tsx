import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { CelulaApontamento } from "./CelulaApontamento";
import type { CelulaDia, ApontamentoDia } from "@/lib/timesheet-types";

const toastSpy = vi.hoisted(() => vi.fn());
const invalidateSpy = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/use-toast", () => ({
  toast: toastSpy,
  useToast: () => ({ toast: toastSpy }),
}));

vi.mock("@/hooks/use-timesheet", () => ({
  useInvalidateTimesheet: () => ({ invalidate: invalidateSpy }),
}));

vi.mock("@/components/ui/popover", () => ({
  Popover: ({
    open,
    onOpenChange,
    children,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
  }) => (
    <div data-open={open}>
      <button onClick={() => onOpenChange(true)}>open</button>
      {children}
    </div>
  ),
  PopoverTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PopoverContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
  }) => <button {...props}>{children}</button>,
}));

describe("CelulaApontamento", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseCelula: CelulaDia = {
    data: "2026-01-20",
    dia_semana: "ter",
    dia_numero: 20,
    total_horas: 0,
    total_formatado: "",
    apontamentos: [],
    eh_hoje: false,
    eh_fim_semana: false,
  };

  it("cria novo apontamento quando célula vazia é clicada", () => {
    const onNovo = vi.fn();
    const onEditar = vi.fn();
    const onExcluir = vi.fn();

    const { container } = render(
      <CelulaApontamento
        celula={baseCelula}
        workItemId={10}
        workItemTitle="Item"
        podeEditar
        podeExcluir
        onNovoApontamento={onNovo}
        onEditarApontamento={onEditar}
        onExcluirApontamento={onExcluir}
      />
    );

    fireEvent.click(container.firstChild as HTMLElement);
    expect(onNovo).toHaveBeenCalledWith(10, "Item", "2026-01-20");
  });

  it("edita apontamento quando há apenas um", () => {
    const apontamento: ApontamentoDia = {
      id: "a1",
      duracao: "01:00",
      duracao_horas: 1,
      id_atividade: "at-1",
      atividade_nome: "Dev",
      comentario: null,
    };

    const onEditar = vi.fn();
    const { container } = render(
      <CelulaApontamento
        celula={{ ...baseCelula, apontamentos: [apontamento], total_formatado: "01:00" }}
        workItemId={10}
        workItemTitle="Item"
        podeEditar
        podeExcluir
        onNovoApontamento={vi.fn()}
        onEditarApontamento={onEditar}
        onExcluirApontamento={vi.fn()}
      />
    );

    fireEvent.click(container.firstChild as HTMLElement);
    expect(onEditar).toHaveBeenCalledWith(apontamento, 10, "Item", "2026-01-20");
  });

  it("abre popover e aciona editar/excluir com múltiplos apontamentos", async () => {
    const user = userEvent.setup();
    const apontamentoA: ApontamentoDia = {
      id: "a1",
      duracao: "01:00",
      duracao_horas: 1,
      id_atividade: "at-1",
      atividade_nome: "Dev",
      comentario: "Comentário",
    };
    const apontamentoB: ApontamentoDia = {
      id: "a2",
      duracao: "02:00",
      duracao_horas: 2,
      id_atividade: "at-2",
      atividade_nome: "Docs",
      comentario: null,
    };

    const onEditar = vi.fn();
    const onNovo = vi.fn();

    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    );

    render(
      <CelulaApontamento
        celula={{
          ...baseCelula,
          apontamentos: [apontamentoA, apontamentoB],
          total_formatado: "03:00",
        }}
        workItemId={10}
        workItemTitle="Item"
        podeEditar
        podeExcluir
        onNovoApontamento={onNovo}
        onEditarApontamento={onEditar}
        onExcluirApontamento={vi.fn()}
      />
    );

    await user.click(screen.getByText("open"));
    await user.click(screen.getAllByTitle("Editar apontamento")[0]);
    expect(onEditar).toHaveBeenCalledWith(apontamentoA, 10, "Item", "2026-01-20");

    await user.click(screen.getAllByTitle("Excluir apontamento")[0]);
    expect(screen.getByText(/Excluir "Dev"\?/)).toBeInTheDocument();
    await user.click(screen.getByText("Confirmar"));
    expect(invalidateSpy).toHaveBeenCalled();
    expect(toastSpy).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Apontamento excluído" })
    );
  });
});
