/**
 * Export service — pure helpers for building the ZIP archive contents. All data
 * access lives in `endpoints`/`requests` services; this file only *shapes* rows
 * and metadata so it stays trivially unit-testable (no Prisma, no I/O).
 */

export type ExportFormat = "ndjson" | "json" | "csv";

export interface ExportOptions {
  includeHeaders: boolean;
  includeBody: boolean;
  redact: boolean;
  format: ExportFormat;
}

/** A captured request as far as export cares (matches the Prisma row shape). */
export interface ExportableRequest {
  id: string;
  method: string;
  statusCode: number;
  duration: number;
  createdAt: Date | string;
  headers?: unknown;
  body?: unknown;
  rawBody?: string | null;
  contentType?: string | null;
  query?: unknown;
  response?: unknown;
  pinned?: boolean;
  expiresAt?: Date | string | null;
}

const REDACTED = "[REDACTED]";

const iso = (v: Date | string | null | undefined): string =>
  v == null ? "" : (v instanceof Date ? v : new Date(v)).toISOString();

/**
 * Shape one request per the export options. Stored headers/body are ALREADY
 * redacted at capture time; the `redact` option additionally masks the verbatim
 * `rawBody` (the only field that retains secrets at rest).
 */
export function shapeRequestForExport(
  r: ExportableRequest,
  opts: ExportOptions
): Record<string, unknown> {
  const out: Record<string, unknown> = {
    id: r.id,
    method: r.method,
    statusCode: r.statusCode,
    duration: r.duration,
    createdAt: iso(r.createdAt),
    query: r.query ?? null,
    response: r.response ?? null,
    pinned: r.pinned ?? false,
  };
  if (opts.includeHeaders) out.headers = r.headers ?? null;
  if (opts.includeBody) {
    out.body = r.body ?? null;
    out.contentType = r.contentType ?? null;
    out.rawBody = opts.redact ? (r.rawBody ? REDACTED : null) : r.rawBody ?? null;
  }
  return out;
}

export const CSV_HEADER = "id,method,statusCode,duration,createdAt";

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** One CSV summary row (method/status/time table for spreadsheet users). */
export function toCsvRow(r: ExportableRequest): string {
  return [
    r.id,
    r.method,
    String(r.statusCode),
    String(r.duration),
    iso(r.createdAt),
  ]
    .map(csvEscape)
    .join(",");
}

/** Filename for an NDJSON / JSON / CSV requests file. */
export function requestsFileName(format: ExportFormat): string {
  if (format === "csv") return "requests.csv";
  if (format === "json") return "requests.json";
  return "requests.ndjson";
}

/** Sanitize an endpoint name into a safe archive directory segment. */
export function safeEntryName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, "_") || "endpoint";
}

export interface ManifestEndpoint {
  id: string;
  name: string;
  requestCount: number;
  retentionDays?: number;
}

/** The self-describing `manifest.json` (carries `schemaVersion` for a future import). */
export function buildManifest(input: {
  userId: string;
  endpoints: ManifestEndpoint[];
  options: ExportOptions;
  range?: { since?: string; until?: string };
  now?: Date;
}) {
  return {
    schemaVersion: 1,
    tool: "webhook-catcher",
    exportedAt: (input.now ?? new Date()).toISOString(),
    userId: input.userId,
    scope: {
      endpointCount: input.endpoints.length,
      range: {
        since: input.range?.since ?? null,
        until: input.range?.until ?? null,
      },
    },
    options: input.options,
    endpoints: input.endpoints.map((e) => ({
      id: e.id,
      name: e.name,
      requestCount: e.requestCount,
      retentionDays: e.retentionDays ?? null,
    })),
  };
}

/** Download filename for the ZIP. */
export function exportFilename(now: Date = new Date()): string {
  return `webhook-catcher-export-${now.toISOString().slice(0, 10)}.zip`;
}

/** Human-readable archive description. */
export function readmeText(): string {
  return [
    "Webhook Catcher export",
    "======================",
    "",
    "Layout:",
    "  manifest.json            who / when / scope / counts / schemaVersion",
    "  endpoints/<name>/",
    "    endpoint.json          endpoint metadata (name, status, retentionDays)",
    "    forwarding.json        configured forwarding URLs",
    "    requests.(ndjson|json|csv)  captured requests",
    "",
    "NDJSON = one JSON object per line (streamable). Secrets in headers/body are",
    "redacted at capture; with the redact option the verbatim rawBody is masked too.",
    "",
  ].join("\n");
}
