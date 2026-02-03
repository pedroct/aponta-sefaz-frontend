import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { IterationSelector } from "./IterationSelector";
import type { Iteration } from "@/lib/iteration-types";

const SelectContext = React.createContext<{
  onValueChange?: (value: string) => void;
}>({});

vi.mock("@/components/ui/select", () => ({
  Select: ({
    children,
    onValueChange,
  }: {
    children: React.ReactNode;
    onValueChange?: (value: string) => void;
  }) => (
    <SelectContext.Provider value={{ onValueChange }}>
      <div>{children}</div>
    </SelectContext.Provider>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectSeparator: () => <hr />,
  SelectItem: ({
    children,
    value,
  }: {
    children: React.ReactNode;
    value: string;
  }) => {
    const ctx = React.useContext(SelectContext);
    return (
      <button onClick={() => ctx.onValueChange?.(value)}>{children}</button>
    );
  },
}));

describe("IterationSelector", () => {
  const iterations: Iteration[] = [
    {
      id: "current",
      name: "Sprint Atual",
      path: null,
      url: null,
      attributes: {
        start_date: "2025-01-01",
        finish_date: "2025-01-15",
        time_frame: "current",
      },
    },
    {
      id: "future",
      name: "Sprint Futura",
      path: null,
      url: null,
      attributes: {
        start_date: "2025-02-01",
        finish_date: "2025-02-15",
        time_frame: "future",
      },
    },
    {
      id: "past",
      name: "Sprint Passada",
      path: null,
      url: null,
      attributes: {
        start_date: "2024-12-01",
        finish_date: "2024-12-15",
        time_frame: "past",
      },
    },
  ];

  it("renderiza loading", () => {
    render(
      <IterationSelector
        value={null}
        onChange={vi.fn()}
        iterations={[]}
        isLoading
      />
    );
    expect(screen.getByText("Carregando sprints...")).toBeInTheDocument();
  });

  it("renderiza vazio quando não há sprints", () => {
    render(
      <IterationSelector
        value={null}
        onChange={vi.fn()}
        iterations={[]}
        isLoading={false}
      />
    );
    expect(screen.getByText("Nenhuma sprint configurada")).toBeInTheDocument();
  });

  it("permite selecionar sprint e opção todas", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <IterationSelector
        value={null}
        onChange={onChange}
        iterations={iterations}
        isLoading={false}
      />
    );

    const allLabels = screen.getAllByText("Todas as Sprints");
    expect(allLabels[0]).toBeInTheDocument();

    await user.click(screen.getByText("Sprint Futura"));
    expect(onChange).toHaveBeenCalledWith("future");

    await user.click(allLabels[allLabels.length - 1]);
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
