/**
 * GET /api/v1/endpoints/:id/requests — fetch captured requests for one endpoint.
 * Read-only, token-scoped, cursor-paginated. Filters: cursor, limit, method,
 * status, since. The endpoint must belong to the token owner (404 otherwise, so
 * we don't leak existence of other users' endpoints).
 */
import { NextRequest } from "next/server";
import * as requests from "@/services/requests";
import { isEndpointOwnedBy } from "@/services/endpoints";
import { requireToken, SCOPE_REQUESTS_READ } from "@/lib/api-token";
import { ok, notFound, fail, failFromError } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireToken(request, SCOPE_REQUESTS_READ);
    if (!auth.ok) return fail(auth.message, auth.status);

    const { id } = await params;
    if (!(await isEndpointOwnedBy(id, auth.userId))) {
      return notFound("Endpoint not found");
    }

    const sp = new URL(request.url).searchParams;
    const page = await requests.listRequests(id, {
      limit: sp.get("limit") ? Number(sp.get("limit")) : undefined,
      cursor: sp.get("cursor"),
      method: sp.get("method") ?? undefined,
      status: sp.get("status") ? Number(sp.get("status")) : undefined,
      since: sp.get("since") ? new Date(sp.get("since")!) : undefined,
    });

    return ok({ items: page.items, nextCursor: page.nextCursor });
  } catch (error) {
    return failFromError(error, "Error fetching requests (v1):");
  }
}
