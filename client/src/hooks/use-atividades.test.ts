import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAtividades } from "./use-atividades";
import React from "react";

// Mock do useAzureContext
const mockApiGet = vi.fn();

vi.mock("@/contexts/AzureDevOpsContext", () => ({
  useAzureContext: () => ({
    api: {
      get: mockApiGet,
    },
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe("useAtividades", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve retornar lista de atividades com sucesso", async () => {
    const mockData = {
      items: [
        { id: "1", nome: "Desenvolvimento", ativo: true },
        { id: "2", nome: "Teste", ativo: true },
      ],
      total: 2,
    };

    mockApiGet.mockResolvedValueOnce(mockData);

    const { result } = renderHook(() => useAtividades(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockData);
  });

  it("deve filtrar por ativo=true", async () => {
    const mockData = {
      items: [{ id: "1", nome: "Desenvolvimento", ativo: true }],
      total: 1,
    };

    mockApiGet.mockResolvedValueOnce(mockData);

    const { result } = renderHook(() => useAtividades({ ativo: true }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiGet).toHaveBeenCalledWith(
      "/atividades",
      expect.objectContaining({
        ativo: true,
      })
    );
  });

  it("deve filtrar por id_projeto", async () => {
    const mockData = {
      items: [],
      total: 0,
    };

    mockApiGet.mockResolvedValueOnce(mockData);

    const { result } = renderHook(
      () => useAtividades({ id_projeto: "projeto-123" }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiGet).toHaveBeenCalledWith(
      "/atividades",
      expect.objectContaining({
        id_projeto: "projeto-123",
      })
    );
  });

  it("deve lidar com erro na requisição", async () => {
    mockApiGet.mockRejectedValueOnce(new Error("Network Error"));

    const { result } = renderHook(() => useAtividades(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it("deve ter staleTime configurado", async () => {
    const mockData = { items: [], total: 0 };

    mockApiGet.mockResolvedValueOnce(mockData);

    const { result } = renderHook(() => useAtividades(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verifica que os dados estão em cache
    expect(result.current.isStale).toBe(false);
  });
});
