/**
 * GET /api/v1/endpoints — list the token owner's endpoints. Read-only, scoped
 * to the bearer PAT's `userId`; an agent can never see another user's data.
 */
import { NextRequest } from "next/server";
import * as endpoints from "@/services/endpoints";
import { requireToken, SCOPE_ENDPOINTS_READ } from "@/lib/api-token";
import { ok, fail, failFromError } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireToken(request, SCOPE_ENDPOINTS_READ);
    if (!auth.ok) return fail(auth.message, auth.status);

    const list = await endpoints.listEndpoints(auth.userId);
    return ok({
      items: list.map((e) => ({
        id: e.id,
        name: e.name,
        description: e.description,
        status: e.status,
        requestCount: e.requestCount,
        retentionDays: e.retentionDays,
        lastActivity: e.lastActivity,
        createdAt: e.createdAt,
      })),
    });
  } catch (error) {
    return failFromError(error, "Error listing endpoints (v1):");
  }
}
