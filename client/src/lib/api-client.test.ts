import { describe, it, expect, beforeEach, vi } from "vitest";

const setupEnv = (env: Record<string, string | undefined>) => {
  const originalEnv = { ...import.meta.env };
  Object.assign(import.meta.env, env);
  return () => Object.assign(import.meta.env, originalEnv);
};

describe("api-client helpers", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("builds API_BASE_URL with /api/v1 suffix when missing", async () => {
    const restore = setupEnv({ VITE_API_URL: "https://api.example.com/" });
    const module = await import("./api-client");
    restore();

    expect(module.API_BASE_URL).toBe("https://api.example.com/api/v1");
  });

  it("keeps API_BASE_URL when already includes /api/v1", async () => {
    const restore = setupEnv({ VITE_API_URL: "https://api.example.com/api/v1" });
    const module = await import("./api-client");
    restore();

    expect(module.API_BASE_URL).toBe("https://api.example.com/api/v1");
  });

  it("getApiUrl prefixes slash when missing", async () => {
    const restore = setupEnv({ VITE_API_URL: "https://api.example.com" });
    const module = await import("./api-client");
    restore();

    expect(module.getApiUrl("atividades")).toBe("https://api.example.com/api/v1/atividades");
  });

  it("buildApiHeaders sets JSON content-type and bearer token", async () => {
    const restore = setupEnv({ VITE_API_TOKEN: "token-123" });
    const module = await import("./api-client");
    const headers = module.buildApiHeaders({ json: true });
    restore();

    expect(headers.get("Content-Type")).toBe("application/json");
    expect(headers.get("Authorization")).toBe("Bearer token-123");
  });
});
