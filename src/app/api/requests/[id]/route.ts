import { NextRequest } from "next/server";
import { z } from "zod";
import * as requests from "@/services/requests";
import { requireOwnerOfRequest } from "@/services/auth";
import { ok, badRequest, fail, failFromError } from "@/lib/http";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireOwnerOfRequest(id);
    if (!auth.ok) return fail(auth.message, auth.status);
    return ok(await requests.deleteRequest(id));
  } catch (error) {
    return failFromError(error, "Error deleting request:");
  }
}

const patchSchema = z.object({ pinned: z.boolean() });

/** Pin / unpin a request (pinned requests are exempt from retention). */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireOwnerOfRequest(id);
    if (!auth.ok) return fail(auth.message, auth.status);
    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) return badRequest("pinned (boolean) required");
    return ok(await requests.setPinned(id, parsed.data.pinned));
  } catch (error) {
    return failFromError(error, "Error updating request:");
  }
}
