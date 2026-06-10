import { describe, it, expect } from "vitest";
import {
  parseTargetUrl,
  isBlockedHostname,
  isBlockedAddress,
  buildHeaderObject,
  methodHasBody,
  MAX_HEADERS,
} from "@/services/http-proxy";

describe("parseTargetUrl", () => {
  it("accepts absolute http(s) URLs", () => {
    expect(parseTargetUrl("https://api.example.com/x").ok).toBe(true);
    expect(parseTargetUrl(" http://example.com ").ok).toBe(true); // trims
  });
  it("rejects empty, relative, and non-http schemes", () => {
    expect(parseTargetUrl("").ok).toBe(false);
    expect(parseTargetUrl("/relative/path").ok).toBe(false);
    expect(parseTargetUrl("ftp://example.com").ok).toBe(false);
    expect(parseTargetUrl("file:///etc/passwd").ok).toBe(false);
    expect(parseTargetUrl("javascript:alert(1)").ok).toBe(false);
  });
});

describe("isBlockedHostname", () => {
  it("blocks localhost and internal suffixes", () => {
    expect(isBlockedHostname("localhost")).toBe(true);
    expect(isBlockedHostname("api.localhost")).toBe(true);
    expect(isBlockedHostname("db.local")).toBe(true);
    expect(isBlockedHostname("svc.internal")).toBe(true);
  });
  it("blocks private/loopback/link-local IP literals", () => {
    expect(isBlockedHostname("127.0.0.1")).toBe(true);
    expect(isBlockedHostname("10.1.2.3")).toBe(true);
    expect(isBlockedHostname("192.168.0.5")).toBe(true);
    expect(isBlockedHostname("172.16.0.1")).toBe(true);
    expect(isBlockedHostname("169.254.169.254")).toBe(true); // cloud metadata
    expect(isBlockedHostname("::1")).toBe(true);
  });
  it("allows public hostnames and public IPs", () => {
    expect(isBlockedHostname("api.stripe.com")).toBe(false);
    expect(isBlockedHostname("example.com")).toBe(false);
    expect(isBlockedHostname("8.8.8.8")).toBe(false);
    expect(isBlockedHostname("172.32.0.1")).toBe(false); // just outside 172.16/12
  });
});

describe("isBlockedAddress", () => {
  it("classifies IPv4 ranges correctly", () => {
    expect(isBlockedAddress("127.0.0.1")).toBe(true);
    expect(isBlockedAddress("0.0.0.0")).toBe(true);
    expect(isBlockedAddress("169.254.169.254")).toBe(true);
    expect(isBlockedAddress("100.64.1.1")).toBe(true); // CGNAT
    expect(isBlockedAddress("1.1.1.1")).toBe(false);
    expect(isBlockedAddress("140.82.121.4")).toBe(false); // github
  });
  it("classifies IPv6 ranges and mapped IPv4", () => {
    expect(isBlockedAddress("::1")).toBe(true);
    expect(isBlockedAddress("fc00::1")).toBe(true); // ULA
    expect(isBlockedAddress("fe80::1")).toBe(true); // link-local
    expect(isBlockedAddress("::ffff:127.0.0.1")).toBe(true); // mapped loopback
    expect(isBlockedAddress("2606:4700:4700::1111")).toBe(false); // cloudflare
  });
  it("fails closed on unrecognized input", () => {
    expect(isBlockedAddress("not-an-ip")).toBe(true);
  });
});

describe("buildHeaderObject", () => {
  it("drops empty keys and hop-by-hop headers, keeps the rest", () => {
    const out = buildHeaderObject([
      { key: "Authorization", value: "Bearer x" },
      { key: "", value: "ignored" },
      { key: "Host", value: "evil.com" }, // stripped
      { key: "content-length", value: "5" }, // stripped
      { key: "X-Custom", value: "1" },
    ]);
    expect(out).toEqual({ Authorization: "Bearer x", "X-Custom": "1" });
  });
  it("caps the number of headers", () => {
    const rows = Array.from({ length: MAX_HEADERS + 10 }, (_, i) => ({ key: `H${i}`, value: "v" }));
    expect(Object.keys(buildHeaderObject(rows)).length).toBe(MAX_HEADERS);
  });
  it("handles undefined", () => {
    expect(buildHeaderObject(undefined)).toEqual({});
  });
});

describe("methodHasBody", () => {
  it("is false for GET/HEAD, true otherwise", () => {
    expect(methodHasBody("GET")).toBe(false);
    expect(methodHasBody("head")).toBe(false);
    expect(methodHasBody("POST")).toBe(true);
    expect(methodHasBody("DELETE")).toBe(true);
  });
});
