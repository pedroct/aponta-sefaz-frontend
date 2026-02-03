import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useIterations } from "./use-iterations";

const mockApiGet = vi.fn();
let mockContext = {
  api: { get: mockApiGet },
  token: "token-123",
  isLoading: false,
};

vi.mock("@/contexts/AzureDevOpsContext", () => ({
  useAzureContext: () => mockContext,
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe("useIterations", () => {
  beforeEach(() => {
    mockApiGet.mockReset();
    mockContext = {
      api: { get: mockApiGet },
      token: "token-123",
      isLoading: false,
    };
  });

  it("chama a API com os parâmetros corretos", async () => {
    mockApiGet.mockResolvedValueOnce({
      count: 0,
      iterations: [],
      current_iteration_id: null,
    });

    const { result } = renderHook(
      () =>
        useIterations({
          organization_name: "org",
          project_id: "proj",
          team_id: "team-1",
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiGet).toHaveBeenCalledWith("/iterations", {
      organization_name: "org",
      project_id: "proj",
      team_id: "team-1",
    });
  });

  it("não executa quando token está ausente", async () => {
    mockContext = {
      api: { get: mockApiGet },
      token: "",
      isLoading: false,
    };

    const { result } = renderHook(
      () => useIterations({ organization_name: "org", project_id: "proj" }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false);
    });

    expect(mockApiGet).not.toHaveBeenCalled();
  });

  it("omite team_id quando não informado", async () => {
    mockApiGet.mockResolvedValueOnce({
      count: 0,
      iterations: [],
      current_iteration_id: null,
    });

    const { result } = renderHook(
      () => useIterations({ organization_name: "org", project_id: "proj" }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiGet).toHaveBeenCalledWith("/iterations", {
      organization_name: "org",
      project_id: "proj",
    });
  });
});
