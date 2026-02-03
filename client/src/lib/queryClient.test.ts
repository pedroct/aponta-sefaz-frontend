import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiRequest, getQueryFn } from "./queryClient";

describe("queryClient helpers", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("apiRequest sends JSON body when data is provided", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    global.fetch = fetchSpy;

    await apiRequest("POST", "/api/test", { name: "Teste" });

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/test",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Teste" }),
        credentials: "include",
      })
    );
  });

  it("apiRequest throws with status and message when response not ok", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(new Response("Falhou", { status: 400 }));
    global.fetch = fetchSpy;

    await expect(apiRequest("GET", "/api/error")).rejects.toThrow("400: Falhou");
  });

  it("getQueryFn returns null on 401 when configured", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(new Response(null, { status: 401 }));
    global.fetch = fetchSpy;

    const queryFn = getQueryFn<{ ok: boolean }>({ on401: "returnNull" });
    const result = await queryFn({ queryKey: ["/api/test"] } as never);

    expect(result).toBeNull();
  });

  it("getQueryFn throws on 401 when configured to throw", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(new Response("Unauthorized", { status: 401 }));
    global.fetch = fetchSpy;

    const queryFn = getQueryFn<{ ok: boolean }>({ on401: "throw" });

    await expect(queryFn({ queryKey: ["/api/test"] } as never)).rejects.toThrow("401:");
  });
});
