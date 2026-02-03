import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const setupEnv = (env: Record<string, string | undefined>) => {
  const originalEnv = { ...import.meta.env };
  Object.assign(import.meta.env, env);
  return () => Object.assign(import.meta.env, originalEnv);
};

describe("api helpers", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("uses VITE_API_URL when provided and normalizes to /api/v1", async () => {
    const restore = setupEnv({ VITE_API_URL: "https://api.example.com/" });
    const module = await import("./api");
    restore();

    expect(module.API_BASE_URL).toBe("https://api.example.com/api/v1");
  });

  it("keeps relative API URL when provided", async () => {
    const restore = setupEnv({ VITE_API_URL: "/api/v1" });
    const module = await import("./api");
    restore();

    expect(module.API_BASE_URL).toBe("/api/v1");
  });

  it("ApiClient retries on 401 and returns JSON", async () => {
    const restore = setupEnv({ VITE_API_URL: "https://api.example.com" });
    const { ApiClient } = await import("./api");
    restore();

    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce(new Response("Unauthorized", { status: 401 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );
    global.fetch = fetchSpy;

    const client = new ApiClient(
      async () => "token-old",
      async () => "token-new",
      "https://api.example.com/api/v1"
    );

    const result = await client.get<{ ok: boolean }>("/health");

    expect(result.ok).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("ApiClient returns undefined for 204 responses", async () => {
    const restore = setupEnv({ VITE_API_URL: "https://api.example.com" });
    const { ApiClient } = await import("./api");
    restore();

    const fetchSpy = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    global.fetch = fetchSpy;

    const client = new ApiClient(
      async () => "",
      async () => "",
      "https://api.example.com/api/v1"
    );

    const result = await client.get("/health");
    expect(result).toBeUndefined();
  });
});
