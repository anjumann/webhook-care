import { describe, it, expect } from "vitest";
import { isSecretHeader, redactHeaders, redactBody } from "@/lib/redact";

describe("isSecretHeader", () => {
  it("flags exact secret header names case-insensitively", () => {
    expect(isSecretHeader("Authorization")).toBe(true);
    expect(isSecretHeader("authorization")).toBe(true);
    expect(isSecretHeader("Cookie")).toBe(true);
    expect(isSecretHeader("x-api-key")).toBe(true);
  });

  it("flags vendor signature headers via prefix/glob patterns", () => {
    expect(isSecretHeader("X-Hub-Signature-256")).toBe(true);
    expect(isSecretHeader("stripe-signature")).toBe(true);
    expect(isSecretHeader("x-shopify-hmac-sha256")).toBe(true);
    expect(isSecretHeader("X-Custom-Signature")).toBe(true);
  });

  it("flags Vercel infra credential headers", () => {
    expect(isSecretHeader("x-vercel-oidc-token")).toBe(true);
    expect(isSecretHeader("X-Vercel-OIDC-Token")).toBe(true);
    expect(isSecretHeader("x-vercel-sc-headers")).toBe(true);
    // proxy signature is covered by the x-*-signature glob
    expect(isSecretHeader("x-vercel-proxy-signature")).toBe(true);
  });

  it("leaves ordinary headers untouched", () => {
    expect(isSecretHeader("content-type")).toBe(false);
    expect(isSecretHeader("user-agent")).toBe(false);
    expect(isSecretHeader("x-request-id")).toBe(false);
    // routing context we intentionally keep (value is scrubbed, name isn't secret)
    expect(isSecretHeader("forwarded")).toBe(false);
    expect(isSecretHeader("x-vercel-proxy-signature-ts")).toBe(false);
  });
});

describe("redactHeaders", () => {
  it("replaces secret values but preserves the rest", () => {
    const out = redactHeaders({
      authorization: "Bearer supersecret",
      "content-type": "application/json",
      "x-hub-signature": "sha1=abc",
    });
    expect(out.authorization).toBe("[REDACTED]");
    expect(out["x-hub-signature"]).toBe("[REDACTED]");
    expect(out["content-type"]).toBe("application/json");
  });

  it("redacts whole-value Vercel infra credential headers", () => {
    const out = redactHeaders({
      "x-vercel-oidc-token": "eyJ0eXAiOiJKV1Qi.payload.sig",
      "x-vercel-sc-headers": '{"Authorization":"Bearer eyJabc.def.ghi"}',
    });
    expect(out["x-vercel-oidc-token"]).toBe("[REDACTED]");
    expect(out["x-vercel-sc-headers"]).toBe("[REDACTED]");
  });

  it("scrubs only the sig= directive from the forwarded header", () => {
    const out = redactHeaders({
      forwarded:
        "for=103.5.135.50;host=webhook.example.com;proto=https;sig=0QmVhcmVyIHNlY3JldA==;exp=1781117795",
    });
    expect(out.forwarded).toBe(
      "for=103.5.135.50;host=webhook.example.com;proto=https;sig=[REDACTED];exp=1781117795"
    );
  });

  it("leaves a forwarded header without sig= untouched", () => {
    const out = redactHeaders({ forwarded: "for=1.2.3.4;proto=https" });
    expect(out.forwarded).toBe("for=1.2.3.4;proto=https");
  });

  it("does not mutate the input object", () => {
    const input = { authorization: "secret" };
    redactHeaders(input);
    expect(input.authorization).toBe("secret");
  });
});

describe("redactBody", () => {
  it("redacts secret-looking keys at any depth", () => {
    const out = redactBody({
      user: "alice",
      password: "hunter2",
      nested: { access_token: "abc", note: "keep" },
      list: [{ client_secret: "x" }, { ok: 1 }],
    });
    expect(out.password).toBe("[REDACTED]");
    expect((out.nested as Record<string, unknown>).access_token).toBe("[REDACTED]");
    expect((out.nested as Record<string, unknown>).note).toBe("keep");
    expect((out.list as Record<string, unknown>[])[0].client_secret).toBe("[REDACTED]");
    expect((out.list as Record<string, unknown>[])[1].ok).toBe(1);
    expect(out.user).toBe("alice");
  });

  it("returns non-object values unchanged", () => {
    expect(redactBody("plain string")).toBe("plain string");
    expect(redactBody(42)).toBe(42);
    expect(redactBody(null)).toBe(null);
  });
});
