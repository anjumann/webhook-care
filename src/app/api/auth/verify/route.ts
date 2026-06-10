import { NextRequest } from "next/server";
import { z } from "zod";
import { verifyMagicLink } from "@/services/auth";
import { ok, badRequest, fail, failFromError } from "@/lib/http";

const schema = z.object({ token: z.string().min(1) });

/**
 * Consume a magic-link token: establishes a verified session cookie (merging
 * the browser's endpoints into the claimed account when applicable).
 */
export async function POST(request: NextRequest) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return badRequest("token required");

    const result = await verifyMagicLink(
      parsed.data.token,
      request.headers.get("user-agent") ?? undefined
    );
    if (!result) return fail("This link is invalid or has expired.", 400);

    return ok({ ok: true, userId: result.userId });
  } catch (error) {
    return failFromError(error, "Error verifying magic link:");
  }
}
