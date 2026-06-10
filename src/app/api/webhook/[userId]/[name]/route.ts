import { NextResponse } from "next/server";
import { findEndpointForIngest } from "@/services/endpoints";
import { captureRequest } from "@/services/requests";
import { redactHeaders, redactBody } from "@/lib/redact";
import { parseError } from "@/lib/error";
import { rateLimit, clientIp } from "@/lib/ratelimit";

type Params = { userId: string; name: string };

export async function GET(request: Request, ctx: { params: Promise<Params> }) {
  return handleWebhook(request, await ctx.params);
}
export async function POST(request: Request, ctx: { params: Promise<Params> }) {
  return handleWebhook(request, await ctx.params);
}
export async function PUT(request: Request, ctx: { params: Promise<Params> }) {
  return handleWebhook(request, await ctx.params);
}
export async function PATCH(request: Request, ctx: { params: Promise<Params> }) {
  return handleWebhook(request, await ctx.params);
}
export async function DELETE(request: Request, ctx: { params: Promise<Params> }) {
  return handleWebhook(request, await ctx.params);
}

const DAY_MS = 24 * 60 * 60 * 1000;
/** Cap stored payload size so a giant body can't blow up a document. */
const MAX_RAW_BODY = 1_000_000; // ~1 MB

/** Parse the verbatim text into a structured body when we know the type. */
function parseBody(
  rawBody: string,
  contentType: string | null
): unknown {
  if (!rawBody) return null;
  try {
    if (contentType?.includes("application/json")) {
      return JSON.parse(rawBody);
    }
    if (contentType?.includes("application/x-www-form-urlencoded")) {
      return Object.fromEntries(new URLSearchParams(rawBody).entries());
    }
  } catch {
    return null;
  }
  return null;
}

async function handleWebhook(request: Request, { userId, name }: Params) {
  const startTime = Date.now();

  try {
    // Abuse guard on the public write path (per IP). No-op unless Redis is
    // configured; one awaited call, fails open — keeps the hot path lean.
    const gate = await rateLimit("ingest", clientIp(request));
    if (!gate.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        {
          status: 429,
          headers: { "Retry-After": String(Math.max(1, Math.ceil((gate.reset - Date.now()) / 1000))) },
        }
      );
    }

    const endpoint = await findEndpointForIngest(userId, name);
    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint not found" }, { status: 404 });
    }

    const method = request.method;
    const url = new URL(request.url);
    const query = Object.fromEntries(url.searchParams.entries());
    const rawHeaders = Object.fromEntries(request.headers.entries());
    const contentType = request.headers.get("content-type");

    // Read the raw body ONCE. This captures every content-type (json, form,
    // xml, text, …) instead of silently dropping unknown types.
    let rawBody = "";
    if (method !== "GET" && method !== "HEAD") {
      rawBody = await request.text();
      if (rawBody.length > MAX_RAW_BODY) {
        rawBody = rawBody.slice(0, MAX_RAW_BODY);
      }
    }
    const parsedBody = parseBody(rawBody, contentType);

    const response = {
      message: "Webhook received successfully",
      timestamp: new Date().toISOString(),
      forwardingUrls: endpoint.forwardingUrls.map((fw) => fw.url),
    };

    const duration = Date.now() - startTime;
    const expiresAt = new Date(
      Date.now() + (endpoint.retentionDays ?? 30) * DAY_MS
    );

    // Persist a REDACTED copy (secret headers / body keys never hit storage),
    // plus the verbatim raw body for fidelity.
    await captureRequest({
      endpointId: endpoint.id,
      method,
      headers: redactHeaders(rawHeaders),
      body: parsedBody ? redactBody(parsedBody) : undefined,
      rawBody: rawBody || null,
      contentType: contentType ?? null,
      query,
      response,
      statusCode: 200,
      duration,
      expiresAt,
    });

    // Forward fire-and-forget with the ORIGINAL headers/body so downstream
    // signature verification still works. Not awaited — never blocks capture.
    if (endpoint.forwardingUrls.length > 0) {
      const forwardHeaders = { ...rawHeaders };
      delete forwardHeaders["host"];
      delete forwardHeaders["content-length"];

      const forwardBody =
        method === "GET" || method === "HEAD" ? undefined : rawBody || undefined;

      void Promise.allSettled(
        endpoint.forwardingUrls.map((fw) =>
          fetch(fw.url, { method, headers: forwardHeaders, body: forwardBody }).catch(
            (err) => console.error(`Error forwarding to ${fw.url}:`, err)
          )
        )
      );
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const { message, code, meta } = parseError(error);
    console.error("Error processing webhook:", message, code, meta);
    return NextResponse.json({ error: message, code, meta }, { status: 500 });
  }
}
