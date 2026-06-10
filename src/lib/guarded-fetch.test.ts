import { afterEach, describe, expect, it, vi } from "vitest";
import { guardedFetch, notifyUnauthorized, onUnauthorized } from "./guarded-fetch";

function mockFetch(status: number) {
  const res = new Response(null, { status });
  return vi.spyOn(globalThis, "fetch").mockResolvedValue(res);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("guardedFetch", () => {
  it("notifies subscribers on a 401 response", async () => {
    mockFetch(401);
    const cb = vi.fn();
    const off = onUnauthorized(cb);

    const res = await guardedFetch("/api/tokens");

    expect(cb).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(401); // response is passed through untouched
    off();
  });

  it("does not notify on a successful response", async () => {
    mockFetch(200);
    const cb = vi.fn();
    const off = onUnauthorized(cb);

    await guardedFetch("/api/tokens");

    expect(cb).not.toHaveBeenCalled();
    off();
  });

  it("does not notify on non-401 errors (403 stays a dead-end)", async () => {
    mockFetch(403);
    const cb = vi.fn();
    const off = onUnauthorized(cb);

    await guardedFetch("/api/tokens");

    expect(cb).not.toHaveBeenCalled();
    off();
  });

  it("fans out to every subscriber and stops after unsubscribe", async () => {
    mockFetch(401);
    const a = vi.fn();
    const b = vi.fn();
    const offA = onUnauthorized(a);
    const offB = onUnauthorized(b);

    notifyUnauthorized();
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);

    offA();
    notifyUnauthorized();
    expect(a).toHaveBeenCalledTimes(1); // unsubscribed
    expect(b).toHaveBeenCalledTimes(2);
    offB();
  });
});
