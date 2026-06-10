/**
 * MCP service — the read-only tool logic behind `/api/mcp`.
 *
 * Backed by the same Prisma service layer as the dashboard + REST API (one
 * source of truth for auth, pagination, filtering). This module adds the
 * agent-facing shaping:
 *  - **Isolation:** every query is scoped to the token owner's `userId`; an
 *    agent can never read another user's data.
 *  - **Redaction:** secrets are stripped from headers + body before they reach
 *    the model (belt-and-suspenders over write-time redaction in ingest).
 *  - **Truncation:** list output caps each body so one huge payload can't blow
 *    the model's context — the agent calls `get_request` for the full body.
 */
import * as endpoints from "@/services/endpoints";
import * as requests from "@/services/requests";
import { redactHeaders, redactBody } from "@/lib/redact";
import type { Request as PrismaRequest } from "../../generated/prisma/client";

/** Serialized bodies longer than this are truncated in list (get_requests) output. */
export const MAX_LIST_BODY_CHARS = 1500;

export interface ToolError {
  error: string;
}

export function isToolError(v: unknown): v is ToolError {
  return (
    typeof v === "object" &&
    v !== null &&
    "error" in v &&
    typeof (v as ToolError).error === "string"
  );
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

/** Redact secret headers when the stored value is a header map. */
function redactReqHeaders(headers: unknown): unknown {
  const rec = asRecord(headers);
  return rec ? redactHeaders(rec) : headers;
}

/**
 * Cap a body for list output. Objects/arrays are serialized first so the cap is
 * by character count regardless of shape. Returns the original value untouched
 * when it's already small (or null).
 */
export function truncateBody(body: unknown): { body: unknown; truncated: boolean } {
  if (body == null) return { body, truncated: false };
  const serialized = typeof body === "string" ? body : JSON.stringify(body);
  if (serialized.length <= MAX_LIST_BODY_CHARS) return { body, truncated: false };
  return {
    body:
      serialized.slice(0, MAX_LIST_BODY_CHARS) +
      "… [truncated — call get_request for the full body]",
    truncated: true,
  };
}

/** A captured request with secrets stripped from headers + body (full body). */
export function redactRequest(req: PrismaRequest) {
  return {
    id: req.id,
    endpointId: req.endpointId,
    method: req.method,
    statusCode: req.statusCode,
    contentType: req.contentType,
    duration: req.duration,
    pinned: req.pinned,
    createdAt: req.createdAt,
    query: req.query,
    headers: redactReqHeaders(req.headers),
    body: redactBody(req.body),
    response: req.response,
  };
}

/** A compact, redacted + truncated summary for list output. */
export function shapeListItem(req: PrismaRequest) {
  const full = redactRequest(req);
  const { body, truncated } = truncateBody(full.body);
  return truncated ? { ...full, body, bodyTruncated: true } : { ...full, body };
}

/** Tool: list the caller's endpoints. */
export async function listEndpointsForAgent(userId: string) {
  const list = await endpoints.listEndpoints(userId);
  return list.map((e) => ({
    id: e.id,
    name: e.name,
    description: e.description,
    status: e.status,
    requestCount: e.requestCount,
    retentionDays: e.retentionDays,
    lastActivity: e.lastActivity,
    createdAt: e.createdAt,
  }));
}

export interface GetRequestsArgs {
  endpoint: string;
  limit?: number;
  cursor?: string;
  method?: string;
  status?: number;
  since?: string;
}

export interface RequestsPage {
  endpointId: string;
  items: ReturnType<typeof shapeListItem>[];
  nextCursor: string | null;
}

/** Tool: fetch captured requests for one endpoint (owner-scoped, paginated). */
export async function getRequestsForAgent(
  userId: string,
  args: GetRequestsArgs
): Promise<RequestsPage | ToolError> {
  const endpointId = await endpoints.findEndpointIdForOwner(userId, args.endpoint);
  if (!endpointId) {
    return { error: `No endpoint found matching "${args.endpoint}"` };
  }

  const page = await requests.listRequests(endpointId, {
    limit: args.limit,
    cursor: args.cursor ?? null,
    method: args.method,
    status: args.status,
    since: args.since ? new Date(args.since) : undefined,
  });

  return {
    endpointId,
    items: page.items.map(shapeListItem),
    nextCursor: page.nextCursor,
  };
}

/** Tool: fetch one captured request in full (owner-scoped, redacted). */
export async function getRequestForAgent(
  userId: string,
  requestId: string
): Promise<ReturnType<typeof redactRequest> | ToolError> {
  const req = await requests.getRequest(requestId);
  // Same 404 for "missing" and "not yours" so we never leak existence.
  if (!req || !(await endpoints.isEndpointOwnedBy(req.endpointId, userId))) {
    return { error: "Request not found" };
  }
  return redactRequest(req);
}
