import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageLayout } from "./PageLayout";

describe("PageLayout", () => {
  it("renders title, header content and children", () => {
    render(
      <PageLayout title="Página">
        <div>Conteúdo</div>
      </PageLayout>
    );

    expect(screen.getByRole("heading", { name: "Página" })).toBeInTheDocument();
    expect(screen.getByText("Conteúdo")).toBeInTheDocument();
  });

  it("renders headerContent when provided", () => {
    render(
      <PageLayout
        title="Página"
        headerContent={<div data-testid="header-content">Header</div>}
      >
        <div>Body</div>
      </PageLayout>
    );

    expect(screen.getByTestId("header-content")).toBeInTheDocument();
  });
});
