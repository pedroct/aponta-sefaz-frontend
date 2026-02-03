import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useSearchWorkItems } from "./use-search-work-items";

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

describe("useSearchWorkItems", () => {
  beforeEach(() => {
    mockApiGet.mockReset();
    mockContext = {
      api: { get: mockApiGet },
      token: "token-123",
      isLoading: false,
    };
  });

  it("não busca quando termo tem menos de 2 caracteres", async () => {
    const { result } = renderHook(
      () => useSearchWorkItems("proj-1", true, "org"),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.handleSearch("a");
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockApiGet).not.toHaveBeenCalled();
    expect(result.current.results).toEqual([]);
  });

  it("busca e filtra apenas Task e Bug", async () => {
    mockApiGet.mockResolvedValueOnce({
      query: "ab",
      project: "proj-1",
      count: 3,
      results: [
        { id: 1, title: "Task ok", type: "Task" },
        { id: 2, title: "Bug ok", type: "Bug" },
        { id: 3, title: "Feature", type: "Feature" },
      ],
    });

    const { result } = renderHook(
      () => useSearchWorkItems("proj-1", true, "org"),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.handleSearch("ab");
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockApiGet).toHaveBeenCalledWith("/work-items/search", {
      query: "ab",
      project_id: "proj-1",
      limit: 10,
      organization_name: "org",
      work_item_types: "Task,Bug",
    });

    expect(result.current.results).toEqual([
      { id: 1, title: "Task ok", type: "Task" },
      { id: 2, title: "Bug ok", type: "Bug" },
    ]);
  });

  it("limpa o termo de busca", async () => {
    mockApiGet.mockResolvedValueOnce({
      query: "ab",
      project: "proj-1",
      count: 0,
      results: [],
    });

    const { result } = renderHook(() => useSearchWorkItems("proj-1"), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.handleSearch("ab");
    });

    await waitFor(() => {
      expect(result.current.searchTerm).toBe("ab");
    });

    act(() => {
      result.current.clear();
    });

    await waitFor(() => {
      expect(result.current.searchTerm).toBe("");
    });
  });
});
