import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCurrentUser } from "./use-current-user";
import React from "react";

// Mock do useAzureContext
const mockApiGet = vi.fn();

vi.mock("@/contexts/AzureDevOpsContext", () => ({
  useAzureContext: () => ({
    api: {
      get: mockApiGet,
    },
    token: "mock-token-for-tests",
    isLoading: false,
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

describe("useCurrentUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve retornar dados do usuário com sucesso", async () => {
    const mockUser = {
      id: "user-123",
      displayName: "Pedro Teixeira",
      emailAddress: "pedro@example.com",
    };

    mockApiGet.mockResolvedValueOnce(mockUser);

    const { result } = renderHook(() => useCurrentUser(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockUser);
  });

  it("deve chamar endpoint correto", async () => {
    const mockUser = {
      id: "user-123",
      displayName: "Test User",
      emailAddress: "test@example.com",
    };

    mockApiGet.mockResolvedValueOnce(mockUser);

    renderHook(() => useCurrentUser(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockApiGet).toHaveBeenCalledWith("/user");
    });
  });

  it("deve retornar valores padrão quando requisição falha", async () => {
    mockApiGet.mockRejectedValueOnce(new Error("Network Error"));

    const { result } = renderHook(() => useCurrentUser(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({
      id: "unknown",
      displayName: "Usuário",
      emailAddress: "",
      avatarUrl: null,
    });
  });

  it("deve ter staleTime configurado", async () => {
    const mockUser = {
      id: "user-123",
      displayName: "Test User",
      emailAddress: "test@example.com",
    };

    mockApiGet.mockResolvedValueOnce(mockUser);

    const { result } = renderHook(() => useCurrentUser(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.isStale).toBe(false);
  });

  it("deve retornar isLoading true enquanto carrega", () => {
    mockApiGet.mockImplementationOnce(
      () => new Promise(() => {}) // Promise que nunca resolve
    );

    const { result } = renderHook(() => useCurrentUser(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });
});
