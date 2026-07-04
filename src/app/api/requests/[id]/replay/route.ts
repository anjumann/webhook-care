/**
 * POST /api/requests/[id]/replay — resend a captured request to its endpoint's
 * forwarding target(s). Owner-guarded (management route) and rate-limited per
 * user (it makes outbound requests). Returns per-target status only — never the
 * target's response body. See `services/replay` for the trust model.
 */
import { NextRequest } from "next/server";
import { requireOwnerOfRequest } from "@/services/auth";
import { replayToForwarding } from "@/services/replay";
import { rateLimit } from "@/lib/ratelimit";
import { ok, fail, tooManyRequests, failFromError } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireOwnerOfRequest(id);
    if (!auth.ok) return fail(auth.message, auth.status);

    const gate = await rateLimit("replay", auth.userId);
    if (!gate.success) return tooManyRequests();

    const result = await replayToForwarding(id);
    if (!result.ok) return fail(result.error, result.status);
    return ok({ results: result.results });
  } catch (error) {
    return failFromError(error, "Error replaying request:");
  }
}
