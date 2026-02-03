import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import {
  useProjetos,
  useProjetosAzure,
  useSincronizarProjetos,
} from "./use-projetos";

const mockApiGet = vi.fn();
const mockApiPost = vi.fn();

vi.mock("@/contexts/AzureDevOpsContext", () => ({
  useAzureContext: () => ({
    api: {
      get: mockApiGet,
      post: mockApiPost,
    },
    token: "mock-token",
    isLoading: false,
  }),
}));

const createWrapper = (queryClient?: QueryClient) => {
  const client =
    queryClient ??
    new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children);
};

describe("useProjetos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normaliza resposta quando API retorna array", async () => {
    const mockData = [
      { id: "1", nome: "Projeto A" },
      { id: "2", nome: "Projeto B" },
    ];

    mockApiGet.mockResolvedValueOnce(mockData);

    const { result } = renderHook(() => useProjetos(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({ items: mockData, total: 2 });
  });

  it("normaliza resposta quando API retorna objeto com items", async () => {
    const mockData = { items: [{ id: "1", nome: "Projeto" }], total: 1 };

    mockApiGet.mockResolvedValueOnce(mockData);

    const { result } = renderHook(() => useProjetos(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockData);
  });
});

describe("useProjetosAzure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("não executa automaticamente (enabled false)", async () => {
    renderHook(() => useProjetosAzure(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(mockApiGet).not.toHaveBeenCalled();
    });
  });
});

describe("useSincronizarProjetos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("invalida cache após sincronização", async () => {
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    mockApiPost.mockResolvedValueOnce({ message: "ok" });

    const { result } = renderHook(() => useSincronizarProjetos(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync();

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: expect.arrayContaining(["projetos", "list"]),
    });
  });
});
