import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import {
  useOrganizationPats,
  useCriarOrganizationPat,
  useAtualizarOrganizationPat,
  useExcluirOrganizationPat,
} from "./use-organization-pats";

const mockApiGet = vi.fn();
const mockApiPost = vi.fn();
const mockApiPut = vi.fn();
const mockApiDelete = vi.fn();

vi.mock("@/contexts/AzureDevOpsContext", () => ({
  useAzureContext: () => ({
    api: {
      get: mockApiGet,
      post: mockApiPost,
      put: mockApiPut,
      delete: mockApiDelete,
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

describe("useOrganizationPats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("monta query string corretamente", async () => {
    mockApiGet.mockResolvedValueOnce({ items: [], total: 0 });

    const { result } = renderHook(
      () => useOrganizationPats({ skip: 1, limit: 2, only_active: true }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiGet).toHaveBeenCalledWith(
      "/organization-pats?skip=1&limit=2&only_active=true"
    );
  });
});

describe("useCriarOrganizationPat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("envia validate_first no URL", async () => {
    const queryClient = new QueryClient();
    mockApiPost.mockResolvedValueOnce({ id: "1" });

    const { result } = renderHook(() => useCriarOrganizationPat(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync({
      organization_name: "org",
      pat: "token",
      validate_first: false,
    });

    expect(mockApiPost).toHaveBeenCalledWith(
      "/organization-pats?validate_first=false",
      expect.objectContaining({ organization_name: "org" })
    );
  });
});

describe("useAtualizarOrganizationPat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("envia PUT com id correto", async () => {
    const queryClient = new QueryClient();
    mockApiPut.mockResolvedValueOnce({ id: "1" });

    const { result } = renderHook(() => useAtualizarOrganizationPat(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync({
      id: "pat-1",
      data: { descricao: "nova" },
    });

    expect(mockApiPut).toHaveBeenCalledWith(
      "/organization-pats/pat-1",
      expect.objectContaining({ descricao: "nova" })
    );
  });
});

describe("useExcluirOrganizationPat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("envia DELETE com id correto", async () => {
    const queryClient = new QueryClient();
    mockApiDelete.mockResolvedValueOnce({});

    const { result } = renderHook(() => useExcluirOrganizationPat(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync("pat-2");

    expect(mockApiDelete).toHaveBeenCalledWith("/organization-pats/pat-2");
  });
});
