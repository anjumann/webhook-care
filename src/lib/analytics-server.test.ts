import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Capture the constructed client so we can assert on capture()/shutdown().
// `vi.hoisted` shares these refs with the hoisted `vi.mock` factory below.
const { PostHog, capture, shutdown } = vi.hoisted(() => {
  const capture = vi.fn();
  const shutdown = vi.fn().mockResolvedValue(undefined);
  const PostHog = vi.fn(function () {
    return { capture, shutdown };
  });
  return { PostHog, capture, shutdown };
});

vi.mock("posthog-node", () => ({ PostHog }));

import { shouldSample, captureServer, analyticsEnabled } from "./analytics-server";

describe("shouldSample", () => {
  it("never samples at rate 0, always at rate 1 (and clamps beyond)", () => {
    expect(shouldSample("k", 0)).toBe(false);
    expect(shouldSample("k", -1)).toBe(false);
    expect(shouldSample("k", 1)).toBe(true);
    expect(shouldSample("k", 2)).toBe(true);
  });

  it("is deterministic — same key + rate always yields the same decision", () => {
    const first = shouldSample("stable-key", 0.5);
    for (let i = 0; i < 100; i++) {
      expect(shouldSample("stable-key", 0.5)).toBe(first);
    }
  });

  it("approximates the target rate across many distinct keys", () => {
    let hits = 0;
    const n = 5000;
    for (let i = 0; i < n; i++) if (shouldSample(`key-${i}`, 0.3)) hits++;
    const observed = hits / n;
    expect(observed).toBeGreaterThan(0.26);
    expect(observed).toBeLessThan(0.34);
  });
});

describe("captureServer", () => {
  const KEY = "NEXT_PUBLIC_POSTHOG_KEY";
  let saved: string | undefined;

  beforeEach(() => {
    saved = process.env[KEY];
    capture.mockClear();
    shutdown.mockClear();
    PostHog.mockClear();
  });
  afterEach(() => {
    if (saved === undefined) delete process.env[KEY];
    else process.env[KEY] = saved;
  });

  it("is a no-op (no client constructed) when the key is unset", async () => {
    delete process.env[KEY];
    expect(analyticsEnabled()).toBe(false);
    await captureServer({ distinctId: "u1", event: "mcp_connected" });
    expect(PostHog).not.toHaveBeenCalled();
    expect(capture).not.toHaveBeenCalled();
  });

  it("is a no-op when there is no distinctId even with a key", async () => {
    process.env[KEY] = "phc_test";
    await captureServer({ distinctId: "", event: "mcp_connected" });
    expect(PostHog).not.toHaveBeenCalled();
  });

  it("captures with sanitized props and shuts down when the key is set", async () => {
    process.env[KEY] = "phc_test";
    await captureServer({
      distinctId: "u1",
      event: "rest_api_called",
      // `authorization` must be stripped by the shared sanitizer
      properties: { route: "endpoints", authorization: "Bearer secret" },
    });
    expect(PostHog).toHaveBeenCalledTimes(1);
    expect(capture).toHaveBeenCalledWith({
      distinctId: "u1",
      event: "rest_api_called",
      properties: { route: "endpoints" },
    });
    expect(shutdown).toHaveBeenCalledTimes(1);
  });
});
