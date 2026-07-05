import { describe, it, expect } from "vitest";
import { buildCurl } from "./curl";

describe("buildCurl", () => {
  it("omits -X for GET and includes it for other methods", () => {
    expect(buildCurl({ url: "https://x.test/hook", method: "GET" })).toBe(
      "curl 'https://x.test/hook'",
    );
    expect(buildCurl({ url: "https://x.test/hook", method: "post" })).toBe(
      "curl -X POST 'https://x.test/hook'",
    );
  });

  it("renders headers, dropping hop-by-hop / host headers", () => {
    const out = buildCurl({
      url: "https://x.test/hook",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Host: "x.test",
        "Content-Length": "12",
      },
    });
    expect(out).toContain("-H 'Content-Type: application/json'");
    expect(out).not.toContain("Host:");
    expect(out).not.toContain("Content-Length");
  });

  it("serializes an object body as JSON and a string body verbatim", () => {
    expect(buildCurl({ url: "u", method: "POST", body: { a: 1 } })).toContain(
      `--data-raw '{"a":1}'`,
    );
    expect(buildCurl({ url: "u", method: "POST", body: "raw text" })).toContain(
      `--data-raw 'raw text'`,
    );
  });

  it("omits the body for GET/empty payloads", () => {
    expect(buildCurl({ url: "u", method: "GET", body: null })).toBe("curl 'u'");
    expect(buildCurl({ url: "u", method: "POST", body: "" })).toBe(
      "curl -X POST 'u'",
    );
  });

  it("escapes single quotes so the command stays valid in a shell", () => {
    const out = buildCurl({
      url: "u",
      method: "POST",
      body: { msg: "it's a 'test'" },
    });
    // each embedded ' becomes '\'' — no unescaped quote can terminate the string
    expect(out).toContain(`'\\''`);
    expect(out).toContain(`--data-raw '{"msg":"it`);
  });

  it("appends captured query params when the url has none", () => {
    expect(
      buildCurl({ url: "https://x.test/hook", method: "GET", query: { a: "1", b: "2" } }),
    ).toBe("curl 'https://x.test/hook?a=1&b=2'");
    // does not double-append when the url already carries a query string
    expect(
      buildCurl({ url: "https://x.test/hook?z=9", method: "GET", query: { a: "1" } }),
    ).toBe("curl 'https://x.test/hook?z=9'");
  });
});
