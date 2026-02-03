import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { DialogConfirmarExclusao } from "./DialogConfirmarExclusao";

const toastSpy = vi.hoisted(() => vi.fn());
const invalidateSpy = vi.hoisted(() => vi.fn());
const deleteSpy = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/use-toast", () => ({
  toast: toastSpy,
  useToast: () => ({ toast: toastSpy }),
}));

vi.mock("@/hooks/use-timesheet", () => ({
  useInvalidateTimesheet: () => ({ invalidate: invalidateSpy }),
}));

vi.mock("@/hooks/use-api", () => ({
  useDeletarApontamento: () => ({ mutateAsync: deleteSpy, isPending: false }),
}));

vi.mock("@/components/ui/alert-dialog", () => ({
  AlertDialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  AlertDialogDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogAction: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => <button onClick={onClick}>{children}</button>,
  AlertDialogCancel: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => <button onClick={onClick}>{children}</button>,
}));

describe("DialogConfirmarExclusao", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mostra aviso quando não pode excluir", () => {
    render(
      <DialogConfirmarExclusao
        isOpen
        onClose={vi.fn()}
        apontamentoId="a1"
        atividadeNome="Dev"
        podeExcluir={false}
      />
    );

    expect(screen.getByText("Ação não permitida")).toBeInTheDocument();
  });

  it("confirma exclusão quando permitido", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    deleteSpy.mockResolvedValue({});

    render(
      <DialogConfirmarExclusao
        isOpen
        onClose={onClose}
        apontamentoId="a1"
        atividadeNome="Dev"
        podeExcluir
      />
    );

    await user.click(screen.getByRole("button", { name: "Excluir" }));
    expect(deleteSpy).toHaveBeenCalled();
    expect(invalidateSpy).toHaveBeenCalled();
    expect(toastSpy).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Apontamento excluído" })
    );
    expect(onClose).toHaveBeenCalled();
  });
});
