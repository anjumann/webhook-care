import { describe, it, expect } from "vitest";
import {
  shapeRequestForExport,
  toCsvRow,
  CSV_HEADER,
  requestsFileName,
  safeEntryName,
  buildManifest,
  exportFilename,
  type ExportOptions,
  type ExportableRequest,
} from "@/services/export";

const baseReq: ExportableRequest = {
  id: "r1",
  method: "POST",
  statusCode: 200,
  duration: 12,
  createdAt: new Date("2026-06-01T10:00:00Z"),
  headers: { "content-type": "application/json", authorization: "[REDACTED]" },
  body: { ok: true },
  rawBody: '{"secret":"shhh"}',
  contentType: "application/json",
  query: { a: "1" },
  response: { message: "ok" },
};

const opts = (over: Partial<ExportOptions> = {}): ExportOptions => ({
  includeHeaders: true,
  includeBody: true,
  redact: true,
  format: "ndjson",
  ...over,
});

describe("shapeRequestForExport", () => {
  it("redacts the verbatim rawBody when redact is on", () => {
    const shaped = shapeRequestForExport(baseReq, opts({ redact: true }));
    expect(shaped.rawBody).toBe("[REDACTED]");
    expect(shaped.body).toEqual({ ok: true });
    expect(shaped.createdAt).toBe("2026-06-01T10:00:00.000Z");
  });

  it("keeps rawBody verbatim when redact is off", () => {
    const shaped = shapeRequestForExport(baseReq, opts({ redact: false }));
    expect(shaped.rawBody).toBe('{"secret":"shhh"}');
  });

  it("omits headers when includeHeaders is false", () => {
    const shaped = shapeRequestForExport(baseReq, opts({ includeHeaders: false }));
    expect(shaped).not.toHaveProperty("headers");
  });

  it("omits body/rawBody/contentType when includeBody is false", () => {
    const shaped = shapeRequestForExport(baseReq, opts({ includeBody: false }));
    expect(shaped).not.toHaveProperty("body");
    expect(shaped).not.toHaveProperty("rawBody");
    expect(shaped).not.toHaveProperty("contentType");
  });
});

describe("toCsvRow", () => {
  it("emits id,method,status,duration,createdAt and escapes commas/quotes", () => {
    const row = toCsvRow({ ...baseReq, method: 'PO,"ST' });
    expect(CSV_HEADER).toBe("id,method,statusCode,duration,createdAt");
    expect(row).toContain("r1");
    expect(row).toContain('"PO,""ST"'); // comma+quote → wrapped & doubled
    expect(row.endsWith("2026-06-01T10:00:00.000Z")).toBe(true);
  });
});

describe("requestsFileName / safeEntryName", () => {
  it("maps each format to a filename", () => {
    expect(requestsFileName("ndjson")).toBe("requests.ndjson");
    expect(requestsFileName("json")).toBe("requests.json");
    expect(requestsFileName("csv")).toBe("requests.csv");
  });

  it("strips unsafe characters from an endpoint dir name", () => {
    expect(safeEntryName("a/b.c")).toBe("a_b_c");
    // path-traversal characters never survive
    const cleaned = safeEntryName("../evil/../name");
    expect(cleaned).not.toMatch(/[./]/);
    expect(safeEntryName("")).toBe("endpoint");
    expect(safeEntryName("my-stripe_hook")).toBe("my-stripe_hook");
  });
});

describe("buildManifest", () => {
  it("carries schemaVersion, scope counts and per-endpoint summary", () => {
    const m = buildManifest({
      userId: "u1",
      endpoints: [{ id: "e1", name: "hook", requestCount: 5, retentionDays: 7 }],
      options: opts(),
      range: { since: undefined, until: undefined },
      now: new Date("2026-06-10T00:00:00Z"),
    });
    expect(m.schemaVersion).toBe(1);
    expect(m.scope.endpointCount).toBe(1);
    expect(m.endpoints[0]).toMatchObject({ id: "e1", name: "hook", requestCount: 5 });
    expect(m.exportedAt).toBe("2026-06-10T00:00:00.000Z");
  });
});

describe("exportFilename", () => {
  it("uses the date in the name", () => {
    expect(exportFilename(new Date("2026-06-09T23:00:00Z"))).toBe(
      "webhook-catcher-export-2026-06-09.zip"
    );
  });
});
