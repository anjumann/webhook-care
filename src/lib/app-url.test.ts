import { describe, expect, it } from "vitest";
import { resolveOrigin } from "./app-url";

describe("resolveOrigin", () => {
  it("prefers a configured APP_URL", () => {
    expect(
      resolveOrigin({ configured: "https://webhook.projext.in", host: "ignored" })
    ).toBe("https://webhook.projext.in");
  });

  it("strips trailing slashes from APP_URL", () => {
    expect(resolveOrigin({ configured: "https://app.example.com/" })).toBe(
      "https://app.example.com"
    );
    expect(resolveOrigin({ configured: "https://app.example.com///" })).toBe(
      "https://app.example.com"
    );
  });

  it("falls back to the forwarded host (https by default) when APP_URL is empty", () => {
    expect(
      resolveOrigin({ configured: "", forwardedHost: "webhook.projext.in" })
    ).toBe("https://webhook.projext.in");
  });

  it("honours x-forwarded-proto on the fallback", () => {
    expect(
      resolveOrigin({
        configured: null,
        forwardedHost: "localhost:3000",
        forwardedProto: "http",
      })
    ).toBe("http://localhost:3000");
  });

  it("uses the host header when there is no forwarded host", () => {
    expect(resolveOrigin({ host: "webhook.projext.in" })).toBe(
      "https://webhook.projext.in"
    );
  });

  it("returns empty string when nothing resolves (so the caller can refuse)", () => {
    expect(resolveOrigin({})).toBe("");
    expect(resolveOrigin({ configured: "  ", host: "" })).toBe("");
  });
})
