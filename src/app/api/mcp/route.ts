/**
 * Remote MCP server — Streamable HTTP, read-only, scoped per user via a bearer
 * PAT. An AI agent (Claude, Cursor, …) connects with `Authorization: Bearer
 * wcat_…` and can call `list_endpoints` / `get_requests` / `get_request`.
 *
 * Tools delegate to `@/services/mcp` (same Prisma service layer as the REST API
 * and dashboard). Auth reuses `resolveToken` from `@/lib/api-token`, so revoking
 * a token in Settings instantly kills MCP access too. SSE is disabled — current
 * MCP clients use Streamable HTTP. (Per-token rate limiting is a follow-up,
 * gated on Upstash Redis being enabled — see B.0; `lastUsedAt` is audited here.)
 *
 * Connect:
 *   claude mcp add --transport http webhook-catcher https://APP/api/mcp \
 *     --header "Authorization: Bearer wcat_xxx"
 */
import { after } from "next/server";
import { createMcpHandler, withMcpAuth } from "mcp-handler";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { z } from "zod";
import * as mcp from "@/services/mcp";
import { resolveToken, touchToken, SCOPE_REQUESTS_READ } from "@/lib/api-token";
import { rateLimit } from "@/lib/ratelimit";
import { captureServer, shouldSample } from "@/lib/analytics-server";

// MCP clients poll (list/read) frequently, so sample the differentiator-use
// signal hard — a light per-user cadence is enough to prove adoption.
const MCP_SAMPLE_RATE = 0.15;

export const runtime = "nodejs";
export const maxDuration = 300;

/** Pull the authenticated userId off the auth info the guard attached. */
function userIdFrom(extra: { authInfo?: AuthInfo }): string {
  const userId = extra.authInfo?.extra?.userId;
  if (typeof userId !== "string") {
    // withMcpAuth (required: true) rejects unauthenticated calls before this,
    // so reaching here means a wiring bug, not a normal auth failure.
    throw new Error("Missing authenticated user on MCP request");
  }
  return userId;
}

/** MCP tools return a content array; JSON results go in a single text block. */
const text = (data: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
});

/** A graceful tool error the agent can react to (e.g. "endpoint not found"). */
const toolError = (message: string) => ({
  isError: true as const,
  content: [{ type: "text" as const, text: message }],
});

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      "list_endpoints",
      {
        description:
          "List the caller's webhook endpoints (id, name, description, status, request count, retention, last activity).",
        inputSchema: {},
      },
      async (_args, extra) =>
        text(await mcp.listEndpointsForAgent(userIdFrom(extra)))
    );

    server.registerTool(
      "get_requests",
      {
        description:
          "Fetch captured webhook requests for an endpoint (paginated, filterable). " +
          "Bodies are truncated in this list — call get_request for a full payload.",
        inputSchema: {
          endpoint: z.string().describe("Endpoint id or name"),
          limit: z.number().int().min(1).max(100).default(25),
          cursor: z.string().optional().describe("Opaque pagination cursor from a prior page"),
          method: z.string().optional().describe("Filter by HTTP method, e.g. POST"),
          status: z.number().int().optional().describe("Filter by response status code"),
          since: z.string().datetime().optional().describe("Only requests newer than this ISO datetime"),
        },
      },
      async (args, extra) => {
        const res = await mcp.getRequestsForAgent(userIdFrom(extra), args);
        return mcp.isToolError(res) ? toolError(res.error) : text(res);
      }
    );

    server.registerTool(
      "get_request",
      {
        description:
          "Fetch a single captured request in full (method, headers, query, body, response, timing). Secrets are redacted.",
        inputSchema: { requestId: z.string() },
      },
      async ({ requestId }, extra) => {
        const res = await mcp.getRequestForAgent(userIdFrom(extra), requestId);
        return mcp.isToolError(res) ? toolError(res.error) : text(res);
      }
    );
  },
  { serverInfo: { name: "webhook-catcher", version: "1.0.0" } },
  { streamableHttpEndpoint: "/api/mcp", disableSse: true, maxDuration: 300 }
);

/**
 * Verify the bearer PAT, require the `requests:read` scope, and attach
 * `{ userId }` to the auth info before any tool runs. Returning `undefined`
 * rejects the call (401). `lastUsedAt` is audited fire-and-forget.
 */
const authed = withMcpAuth(
  handler,
  async (_req, bearer) => {
    const token = await resolveToken(bearer);
    if (!token || !token.scopes.includes(SCOPE_REQUESTS_READ)) return undefined;
    // Per-token rate limit (no-op unless Redis is configured). Throwing a
    // Response short-circuits with a 429 before any tool runs.
    const gate = await rateLimit("token", token.id);
    if (!gate.success) {
      throw new Response("Rate limit exceeded for this token", { status: 429 });
    }
    touchToken(token.id);

    // Differentiator-use signal (spec §6). Off the response path, sampled,
    // no payload. Best-effort — guarded so it never blocks/rejects the tool call.
    try {
      if (shouldSample(`${token.userId}:${Date.now()}`, MCP_SAMPLE_RATE)) {
        after(() =>
          captureServer({ distinctId: token.userId, event: "mcp_connected" }),
        );
      }
    } catch {
      /* analytics is best-effort */
    }

    return {
      token: bearer ?? "",
      clientId: token.id,
      scopes: token.scopes,
      extra: { userId: token.userId, tokenId: token.id },
    } satisfies AuthInfo;
  },
  { required: true }
);

export { authed as GET, authed as POST };
