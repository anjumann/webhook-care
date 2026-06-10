/**
 * Synchronous ZIP export — owner-guarded. Streams a `archiver` ZIP straight to
 * the response so memory stays flat regardless of dataset size: requests are
 * pulled in cursor batches (`cursorRequests`) and piped into per-endpoint files.
 *
 * Layout: manifest.json + README.txt + endpoints/<name>/{endpoint,forwarding}.json
 * + requests.(ndjson|json|csv). Large exports (Blob + emailed link) are a
 * separate async job — see docs/04 §B.3 (deferred, free-tier streams inline).
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { ZipArchive } from "archiver";
import { PassThrough, Readable } from "node:stream";
import { requireOwner } from "@/services/auth";
import { listEndpointsForExport } from "@/services/endpoints";
import { cursorRequests } from "@/services/requests";
import {
  buildManifest,
  exportFilename,
  readmeText,
  requestsFileName,
  safeEntryName,
  shapeRequestForExport,
  toCsvRow,
  CSV_HEADER,
  type ExportOptions,
} from "@/services/export";
import { badRequest, fail, tooManyRequests } from "@/lib/http";
import { rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 300;

const exportSchema = z.object({
  userId: z.string().min(1),
  endpointIds: z.array(z.string()).optional(),
  since: z.string().datetime().optional(),
  until: z.string().datetime().optional(),
  redact: z.boolean().default(true),
  includeHeaders: z.boolean().default(true),
  includeBody: z.boolean().default(true),
  format: z.enum(["ndjson", "json", "csv"]).default("ndjson"),
});

export async function POST(request: NextRequest) {
  const parsed = exportSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return badRequest(parsed.error?.issues[0]?.message ?? "Invalid export request");
  }
  const { userId, endpointIds, since, until, redact, includeHeaders, includeBody, format } =
    parsed.data;

  const auth = await requireOwner(userId);
  if (!auth.ok) return fail(auth.message, auth.status);

  // Exports are heavy (full stream of an account's requests) — throttle per user.
  const gate = await rateLimit("export", userId);
  if (!gate.success) return tooManyRequests("Too many exports. Please try again later.");

  const endpoints = await listEndpointsForExport(userId, endpointIds);
  const options: ExportOptions = { includeHeaders, includeBody, redact, format };
  const range = {
    since: since ? new Date(since) : undefined,
    until: until ? new Date(until) : undefined,
  };

  const archive = new ZipArchive({ zlib: { level: 9 } });
  archive.on("error", (err) => console.error("[export] archive error:", err));

  // Produce entries off the response path; archiver streams them as they arrive.
  void (async () => {
    try {
      archive.append(readmeText(), { name: "README.txt" });
      archive.append(
        JSON.stringify(
          buildManifest({
            userId,
            endpoints: endpoints.map((e) => ({
              id: e.id,
              name: e.name,
              requestCount: e.requestCount,
              retentionDays: e.retentionDays,
            })),
            options,
            range: { since, until },
          }),
          null,
          2
        ),
        { name: "manifest.json" }
      );

      for (const ep of endpoints) {
        const dir = `endpoints/${safeEntryName(ep.name)}`;
        const { forwardingUrls, ...meta } = ep;
        archive.append(JSON.stringify(meta, null, 2), { name: `${dir}/endpoint.json` });
        archive.append(JSON.stringify(forwardingUrls, null, 2), {
          name: `${dir}/forwarding.json`,
        });

        const out = new PassThrough();
        archive.append(out, { name: `${dir}/${requestsFileName(format)}` });

        if (format === "csv") out.write(CSV_HEADER + "\n");
        else if (format === "json") out.write("[\n");

        let first = true;
        for await (const batch of cursorRequests(ep.id, range)) {
          for (const r of batch) {
            if (format === "ndjson") {
              out.write(JSON.stringify(shapeRequestForExport(r, options)) + "\n");
            } else if (format === "csv") {
              out.write(toCsvRow(r) + "\n");
            } else {
              out.write(
                (first ? "" : ",\n") +
                  JSON.stringify(shapeRequestForExport(r, options), null, 2)
              );
              first = false;
            }
          }
        }
        if (format === "json") out.write("\n]\n");
        out.end();
      }

      await archive.finalize();
    } catch (err) {
      console.error("[export] build failed:", err);
      archive.abort();
    }
  })();

  const webStream = Readable.toWeb(archive as unknown as Readable) as ReadableStream;
  return new Response(webStream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${exportFilename()}"`,
      "Cache-Control": "no-store",
    },
  });
}
