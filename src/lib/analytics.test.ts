import { describe, it, expect, vi } from "vitest";

// posthog-js is a browser SDK; stub it so importing the module under test is
// side-effect-free and deterministic in the Node/jsdom test runtime.
vi.mock("posthog-js", () => ({
  default: { capture: vi.fn(), identify: vi.fn(), reset: vi.fn() },
}));

import { sanitizeEventProps, sanitizePersonProps } from "./analytics";

describe("sanitizeEventProps", () => {
  it("keeps safe scalar props verbatim", () => {
    expect(
      sanitizeEventProps({ provider: "stripe", count: 3, redacted: true }),
    ).toEqual({ provider: "stripe", count: 3, redacted: true });
  });

  it("drops any key that could carry payload/secret content (substring, case-insensitive)", () => {
    const cleaned = sanitizeEventProps({
      body: "{...}",
      rawBody: "x",
      headers_count: 5,
      Authorization: "Bearer x",
      Cookie: "s=1",
      api_key: "k",
      signature: "sig",
      email: "a@b.com",
      response_status: 200,
      provider: "github",
      count: 2,
    });
    expect(cleaned).toEqual({ provider: "github", count: 2 });
  });

  it("drops undefined but preserves null, false, and 0", () => {
    expect(
      sanitizeEventProps({ a: undefined, b: null, c: false, d: 0 }),
    ).toEqual({ b: null, c: false, d: 0 });
  });

  it("returns an empty object for no input", () => {
    expect(sanitizeEventProps()).toEqual({});
  });

  it("never lets email through on an event", () => {
    expect(sanitizeEventProps({ email: "a@b.com", count: 1 })).toEqual({ count: 1 });
  });
});

describe("sanitizePersonProps", () => {
  it("allows email + known person props (product decision: attach for claimed users)", () => {
    expect(
      sanitizePersonProps({ email: "a@b.com", is_claimed: true, endpoint_count: 4 }),
    ).toEqual({ email: "a@b.com", is_claimed: true, endpoint_count: 4 });
  });

  it("omits email when absent and drops unknown keys (allowlist)", () => {
    expect(
      sanitizePersonProps({ is_claimed: false } as never),
    ).toEqual({ is_claimed: false });
  });

  it("returns an empty object for no input", () => {
    expect(sanitizePersonProps()).toEqual({});
  });
});
