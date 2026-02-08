import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useTeams } from "./use-teams";

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

describe("useTeams", () => {
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
      count: 2,
      teams: [
        { id: "team-1", name: "Team 1", project_id: "proj", project_name: "Project" },
        { id: "team-2", name: "Team 2", project_id: "proj", project_name: "Project" },
      ],
      mine_only: true,
      is_admin: false,
      default_team_id: "team-1",
    });

    const { result } = renderHook(
      () =>
        useTeams({
          organization_name: "org",
          project_id: "proj",
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiGet).toHaveBeenCalledWith("/teams", {
      organization_name: "org",
      project_id: "proj",
    });
  });

  it("não executa quando token está ausente", async () => {
    mockContext = {
      api: { get: mockApiGet },
      token: "",
      isLoading: false,
    };

    const { result } = renderHook(
      () => useTeams({ organization_name: "org", project_id: "proj" }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false);
    });

    expect(mockApiGet).not.toHaveBeenCalled();
  });

  it("não executa quando enabled=false", async () => {
    const { result } = renderHook(
      () =>
        useTeams({
          organization_name: "org",
          project_id: "proj",
          enabled: false,
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false);
    });

    expect(mockApiGet).not.toHaveBeenCalled();
  });

  it("retorna is_admin e mine_only corretamente", async () => {
    mockApiGet.mockResolvedValueOnce({
      count: 5,
      teams: [
        { id: "team-1", name: "Team 1", project_id: "proj", project_name: "Project" },
      ],
      mine_only: false,
      is_admin: true,
      default_team_id: "team-1",
    });

    const { result } = renderHook(
      () =>
        useTeams({
          organization_name: "org",
          project_id: "proj",
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.is_admin).toBe(true);
    expect(result.current.data?.mine_only).toBe(false);
    expect(result.current.data?.default_team_id).toBe("team-1");
  });

  it("não executa quando organization_name ou project_id estão ausentes", async () => {
    const { result } = renderHook(
      () =>
        useTeams({
          organization_name: "",
          project_id: "proj",
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false);
    });

    expect(mockApiGet).not.toHaveBeenCalled();
  });
});
