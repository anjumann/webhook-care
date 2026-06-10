/**
 * GET /api/v1/requests/:id — fetch one captured request in full. Read-only and
 * token-scoped: the request's endpoint must belong to the token owner.
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
    const req = await requests.getRequest(id);
    if (!req || !(await isEndpointOwnedBy(req.endpointId, auth.userId))) {
      return notFound("Request not found");
    }
    return ok(req);
  } catch (error) {
    return failFromError(error, "Error fetching request (v1):");
  }
}
