import { NextRequest } from "next/server";
import * as requests from "@/services/requests";
import { requireOwnerOfEndpoint } from "@/services/auth";
import { ok, badRequest, fail, failFromError } from "@/lib/http";

export async function DELETE(request: NextRequest) {
  try {
    const endpointId = new URL(request.url).searchParams.get("endpointId");
    if (!endpointId) return badRequest("endpointId required");
    const auth = await requireOwnerOfEndpoint(endpointId);
    if (!auth.ok) return fail(auth.message, auth.status);
    const { count } = await requests.deleteAllRequests(endpointId);
    return ok({ success: true, deleted: count });
  } catch (error) {
    return failFromError(error, "Error clearing requests:");
  }
}
