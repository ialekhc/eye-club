import { afterEach, describe, expect, it, vi } from "vitest";
import { clearAccessToken, listProducts, setAccessToken } from "./api-client";

afterEach(() => { vi.restoreAllMocks(); });

describe("api client", () => {
  it("sends the access token and organization scope", async () => {
    const storage = new Map<string, string>();
    vi.stubGlobal("window", { sessionStorage: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => { storage.set(key, value); }, removeItem: (key: string) => { storage.delete(key); } } });
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ items: [], page: 1, pageSize: 25, total: 0 }), { status: 200 }));
    setAccessToken("token");
    await listProducts("org-a", { status: "ACTIVE" });
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:4000/api/v1/products?status=ACTIVE", expect.objectContaining({ headers: expect.any(Headers) }));
    const headers = (fetchMock.mock.calls[0]?.[1] as RequestInit).headers as Headers;
    expect(headers.get("authorization")).toBe("Bearer token");
    expect(headers.get("x-organization-id")).toBe("org-a");
    clearAccessToken();
  });

  it("surfaces structured API errors", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ message: "Forbidden" }), { status: 403 }));
    await expect(listProducts("org-a")).rejects.toEqual(expect.objectContaining({ name: "ApiClientError", status: 403, message: "Forbidden" }));
  });
});
