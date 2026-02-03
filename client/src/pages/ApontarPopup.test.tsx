import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import ApontarPopup from "./ApontarPopup";

vi.mock("@/components/custom/ModalAdicionarTempo", () => ({
  ModalAdicionarTempo: ({ taskId, taskTitle }: { taskId: string; taskTitle: string }) => (
    <div data-testid="modal" data-task-id={taskId} data-task-title={taskTitle} />
  ),
}));

describe("ApontarPopup", () => {
  beforeEach(() => {
    localStorage.clear();
    window.location.hash = "";
  });

  it("renderiza modal mesmo sem parâmetros", async () => {
    render(<ApontarPopup />);
    const modal = await screen.findByTestId("modal");
    expect(modal).toHaveAttribute("data-task-id", "");
  });

  it("carrega params da URL e renderiza modal", async () => {
    window.location.hash =
      "#/apontar?workItemId=123&workItemTitle=Minha%20Tarefa&organization=org&project=proj&projectId=proj-1&token=abc";

    render(<ApontarPopup />);

    const modal = await screen.findByTestId("modal");
    expect(modal).toHaveAttribute("data-task-id", "123");
    expect(modal).toHaveAttribute("data-task-title", "Minha Tarefa");

    expect(localStorage.getItem("azdo_token")).toBe("abc");
    expect(localStorage.getItem("azdo_context")).toContain("org");
  });

  it("exibe erro quando URL está inválida", async () => {
    window.location.hash = "#/apontar?workItemTitle=%E0%A4%A"; // URI malformada

    render(<ApontarPopup />);

    expect(await screen.findByText("Erro ao carregar")).toBeInTheDocument();
  });
});
