import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { useHashLocation } from "./hashLocation";

function HashLocationTester() {
  const [path, navigate] = useHashLocation();
  return (
    <div>
      <span data-testid="path">{path}</span>
      <button onClick={() => navigate("/config")}>Go Config</button>
      <button onClick={() => navigate("/config?x=1")}>Go Config Query</button>
      <button onClick={() => navigate("/replace", { replace: true })}>Replace</button>
    </div>
  );
}

describe("useHashLocation", () => {
  beforeEach(() => {
    window.location.hash = "#/atividades?token=abc";
  });

  it("extracts path from hash ignoring query params", () => {
    render(<HashLocationTester />);
    expect(screen.getByTestId("path")).toHaveTextContent("/atividades");
  });

  it("preserves current query params when navigating without query", async () => {
    const user = userEvent.setup();
    render(<HashLocationTester />);

    await user.click(screen.getByRole("button", { name: "Go Config" }));
    expect(window.location.hash).toBe("#/config?token=abc");
  });

  it("does not preserve query params when new path has query", async () => {
    const user = userEvent.setup();
    render(<HashLocationTester />);

    await user.click(screen.getByRole("button", { name: "Go Config Query" }));
    expect(window.location.hash).toBe("#/config?x=1");
  });

  it("uses replaceState when replace option is true", async () => {
    const user = userEvent.setup();
    const replaceSpy = vi.spyOn(window.history, "replaceState");

    render(<HashLocationTester />);
    await user.click(screen.getByRole("button", { name: "Replace" }));

    expect(replaceSpy).toHaveBeenCalled();
    replaceSpy.mockRestore();
  });
});
