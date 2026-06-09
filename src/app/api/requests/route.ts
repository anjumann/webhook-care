import { NextRequest } from "next/server";
import * as requests from "@/services/requests";
import { ok, badRequest, failFromError } from "@/lib/http";

export async function DELETE(request: NextRequest) {
  try {
    const endpointId = new URL(request.url).searchParams.get("endpointId");
    if (!endpointId) return badRequest("endpointId required");
    const { count } = await requests.deleteAllRequests(endpointId);
    return ok({ success: true, deleted: count });
  } catch (error) {
    return failFromError(error, "Error clearing requests:");
  }
}
