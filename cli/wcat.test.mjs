import { describe, it, expect } from "vitest";
import {
  parseArgs,
  normalizeTarget,
  buildReplay,
  createSseParser,
} from "./wcat.mjs";

describe("parseArgs", () => {
  it("extracts the command and --key value pairs", () => {
    const { command, opts } = parseArgs([
      "listen",
      "--endpoint",
      "my-hook",
      "--forward",
      "localhost:3000",
    ]);
    expect(command).toBe("listen");
    expect(opts).toEqual({ endpoint: "my-hook", forward: "localhost:3000" });
  });

  it("treats a flag followed by another flag (or nothing) as a boolean", () => {
    const { opts } = parseArgs(["listen", "--verbose", "--endpoint", "x"]);
    expect(opts.verbose).toBe(true);
    expect(opts.endpoint).toBe("x");
  });
});

describe("normalizeTarget", () => {
  it("defaults a bare host:port to http and strips a trailing slash", () => {
    expect(normalizeTarget("localhost:3000")).toBe("http://localhost:3000");
  });

  it("keeps an explicit scheme and path", () => {
    expect(normalizeTarget("https://example.com/webhooks")).toBe(
      "https://example.com/webhooks"
    );
  });

  it("throws when no target is given", () => {
    expect(() => normalizeTarget(undefined)).toThrow(/required/);
  });
});

describe("buildReplay", () => {
  it("forwards method, body, and query; drops hop-by-hop headers", () => {
    const row = {
      method: "post",
      headers: { "Content-Type": "application/json", Host: "wcat.dev", "Content-Length": "9" },
      rawBody: '{"a":1}',
      query: { sig: "abc" },
    };
    const { url, init } = buildReplay(row, "http://localhost:3000/hook");
    expect(url).toBe("http://localhost:3000/hook?sig=abc");
    expect(init.method).toBe("POST");
    expect(init.body).toBe('{"a":1}');
    expect(init.headers.Host).toBeUndefined();
    expect(init.headers["Content-Length"]).toBeUndefined();
    expect(init.headers["Content-Type"]).toBe("application/json");
  });

  it("serializes a parsed body and sets a JSON content-type when none present", () => {
    const { init } = buildReplay(
      { method: "POST", headers: {}, body: { x: 1 } },
      "http://localhost:3000"
    );
    expect(init.body).toBe('{"x":1}');
    expect(init.headers["content-type"]).toBe("application/json");
  });

  it("omits a body for GET", () => {
    const { init } = buildReplay(
      { method: "GET", headers: {}, rawBody: "ignored" },
      "http://localhost:3000"
    );
    expect(init.body).toBeUndefined();
  });
});

describe("createSseParser", () => {
  it("parses a complete event", () => {
    const push = createSseParser();
    const events = push('event: request\ndata: {"id":"1"}\n\n');
    expect(events).toEqual([{ event: "request", data: '{"id":"1"}' }]);
  });

  it("buffers an event split across chunks", () => {
    const push = createSseParser();
    expect(push("event: request\ndata: {")).toEqual([]);
    const events = push('"id":"1"}\n\n');
    expect(events).toEqual([{ event: "request", data: '{"id":"1"}' }]);
  });

  it("ignores comment heartbeats and joins multi-line data", () => {
    const push = createSseParser();
    const events = push(": hb\n\nevent: x\ndata: a\ndata: b\n\n");
    expect(events).toEqual([{ event: "x", data: "a\nb" }]);
  });
});
