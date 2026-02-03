import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useAzureDevOps } from "./use-azure-devops";

const setUrl = (url: string) => {
  window.history.pushState({}, "", url);
};

describe("useAzureDevOps", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_AZURE_PAT", "");
    vi.stubEnv("VITE_API_TOKEN", "");
    vi.stubEnv("VITE_AZURE_ORG", "");
    vi.stubEnv("VITE_AZURE_PROJECT", "");
    setUrl("/");
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("inicializa via query params quando em Azure DevOps", async () => {
    setUrl(
      "/?embedded=true&source=azdo-boards&token=token-123&organization=org&project=proj&projectId=pid&userId=u1"
    );

    const { result } = renderHook(() => useAzureDevOps());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isInAzureDevOps).toBe(true);
    expect(result.current.token).toBe("token-123");
    expect(result.current.context).toEqual(
      expect.objectContaining({
        organization: "org",
        project: "proj",
        projectId: "pid",
        userId: "u1",
      })
    );

    await expect(result.current.refreshToken()).resolves.toBe("token-123");
  });

  it("inicializa via hash query quando não há search params", async () => {
    setUrl(
      "/#/atividades?embedded=true&source=azdo-devops&token=hash-token&organization=org&project=proj&projectId=pid"
    );

    const { result } = renderHook(() => useAzureDevOps());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isInAzureDevOps).toBe(true);
    expect(result.current.token).toBe("hash-token");
  });

  it("fallback para standalone quando não há params", async () => {
    vi.stubEnv("VITE_AZURE_PAT", "pat-999");
    vi.stubEnv("VITE_AZURE_ORG", "org-local");
    vi.stubEnv("VITE_AZURE_PROJECT", "proj-local");

    const { result } = renderHook(() => useAzureDevOps());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isInAzureDevOps).toBe(false);
    expect(result.current.token).toBe("pat-999");
    expect(result.current.context).toEqual(
      expect.objectContaining({
        organization: "org-local",
        project: "proj-local",
        projectId: "",
      })
    );

    await expect(result.current.refreshToken()).resolves.toBe("pat-999");
  });
});
