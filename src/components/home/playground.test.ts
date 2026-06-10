import { describe, expect, it } from "vitest";
import {
  buildSampleRequest,
  PLAYGROUND_KINDS,
  REDACTED,
} from "./playground";

describe("buildSampleRequest", () => {
  it("produces valid JSON bodies for every kind", () => {
    for (const kind of PLAYGROUND_KINDS) {
      const req = buildSampleRequest(kind, 1);
      expect(() => JSON.parse(req.body)).not.toThrow();
    }
  });

  it("is deterministic in (kind, seq)", () => {
    for (const kind of PLAYGROUND_KINDS) {
      expect(buildSampleRequest(kind, 7)).toEqual(buildSampleRequest(kind, 7));
    }
  });

  it("varies ids across sequence numbers (rows need unique keys)", () => {
    const ids = [1, 2, 3].map((seq) => buildSampleRequest("stripe", seq).id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("shows provider signature headers as redacted, mirroring lib/redact", () => {
    const signatureHeaders: Record<string, string> = {
      stripe: "stripe-signature",
      github: "x-hub-signature-256",
      shopify: "x-shopify-hmac-sha256",
    };
    for (const [kind, header] of Object.entries(signatureHeaders)) {
      const req = buildSampleRequest(kind as "stripe", 1);
      const value = req.headers.find(([name]) => name === header)?.[1];
      expect(value).toBe(REDACTED);
    }
  });

  it("always includes a content-type header and POST method", () => {
    for (const kind of PLAYGROUND_KINDS) {
      const req = buildSampleRequest(kind, 2);
      expect(req.method).toBe("POST");
      expect(req.headers.map(([name]) => name)).toContain("content-type");
    }
  });
});
