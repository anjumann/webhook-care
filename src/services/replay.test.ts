import { describe, it, expect, vi, beforeEach } from "vitest";

const prismaMock = vi.hoisted(() => ({
  request: { findUnique: vi.fn() },
}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import {
  buildReplayHeaders,
  buildReplayBody,
  replayToForwarding,
} from "@/services/replay";

beforeEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("buildReplayHeaders", () => {
  it("drops transport/host headers, keeps the rest", () => {
    expect(
      buildReplayHeaders({
        Host: "x.test",
        "Content-Length": "10",
        "Accept-Encoding": "gzip",
        "Content-Type": "application/json",
        "X-Custom": "keep",
      })
    ).toEqual({ "Content-Type": "application/json", "X-Custom": "keep" });
  });

  it("handles null/undefined header maps", () => {
    expect(buildReplayHeaders(null)).toEqual({});
    expect(buildReplayHeaders(undefined)).toEqual({});
  });
});

describe("buildReplayBody", () => {
  it("returns undefined for GET/HEAD", () => {
    expect(buildReplayBody("GET", "x", { a: 1 })).toBeUndefined();
    expect(buildReplayBody("HEAD", "x", null)).toBeUndefined();
  });

  it("prefers the verbatim rawBody, else serializes the parsed body", () => {
    expect(buildReplayBody("POST", "raw-verbatim", { a: 1 })).toBe("raw-verbatim");
    expect(buildReplayBody("POST", null, { a: 1 })).toBe('{"a":1}');
    expect(buildReplayBody("POST", "", { a: 1 })).toBe('{"a":1}');
    expect(buildReplayBody("POST", null, null)).toBeUndefined();
  });
});

describe("replayToForwarding", () => {
  it("404s when the request is gone", async () => {
    prismaMock.request.findUnique.mockResolvedValue(null);
    const out = await replayToForwarding("missing");
    expect(out).toEqual({ ok: false, status: 404, error: expect.any(String) });
  });

  it("400s when the endpoint has no forwarding targets", async () => {
    prismaMock.request.findUnique.mockResolvedValue({
      method: "POST",
      headers: {},
      rawBody: "{}",
      body: null,
      endpoint: { forwardingUrls: [] },
    });
    const out = await replayToForwarding("r1");
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.status).toBe(400);
  });

  it("POSTs the stored request to each target and reports status", async () => {
    prismaMock.request.findUnique.mockResolvedValue({
      method: "post",
      headers: { Host: "x.test", "X-Custom": "v" },
      rawBody: '{"hello":"world"}',
      body: { hello: "world" },
      endpoint: {
        forwardingUrls: [{ url: "https://a.test/hook" }, { url: "https://b.test/hook" }],
      },
    });
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("ok", { status: 200 }));

    const out = await replayToForwarding("r1");
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.results).toEqual([
        { url: "https://a.test/hook", ok: true, status: 200 },
        { url: "https://b.test/hook", ok: true, status: 200 },
      ]);
    }
    // uppercases the method, strips Host, sends the verbatim rawBody
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.method).toBe("POST");
    expect(init.body).toBe('{"hello":"world"}');
    expect(init.headers).toEqual({ "X-Custom": "v" });
    expect(init.redirect).toBe("manual");
  });

  it("reports a per-target error without failing the whole replay", async () => {
    prismaMock.request.findUnique.mockResolvedValue({
      method: "POST",
      headers: {},
      rawBody: "{}",
      body: null,
      endpoint: {
        forwardingUrls: [{ url: "https://a.test/hook" }, { url: "ftp://nope" }],
      },
    });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));

    const out = await replayToForwarding("r1");
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.results[0]).toEqual({ url: "https://a.test/hook", ok: true, status: 204 });
      expect(out.results[1]).toMatchObject({ url: "ftp://nope", ok: false });
    }
  });
});
