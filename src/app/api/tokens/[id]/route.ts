/**
 * DELETE /api/tokens/:id — revoke a token. Session-guarded by the token's owner
 * (we resolve the owner first, then prove the caller is that owner). Revoking
 * instantly kills both REST and MCP access.
 */
import { NextRequest } from "next/server";
import * as tokens from "@/services/tokens";
import { requireOwner } from "@/services/auth";
import { ok, notFound, fail, failFromError } from "@/lib/http";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ownerId = await tokens.getTokenOwner(id);
    if (!ownerId) return notFound("Token not found");
    const auth = await requireOwner(ownerId);
    if (!auth.ok) return fail(auth.message, auth.status);
    return ok(await tokens.deleteToken(id));
  } catch (error) {
    return failFromError(error, "Error deleting token:");
  }
}
