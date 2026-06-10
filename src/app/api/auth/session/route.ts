import { NextRequest } from "next/server";
import { z } from "zod";
import { setAnonSession } from "@/services/auth";
import { ok, badRequest, failFromError } from "@/lib/http";

const schema = z.object({ userId: z.string().min(1) });

/**
 * Establish an anonymous session cookie for the caller's ULID. No-ops (returns
 * established:false) for email-claimed accounts — those require a magic-link
 * login, so the ULID alone can't grant access.
 */
export async function POST(request: NextRequest) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return badRequest("userId required");
    const established = await setAnonSession(parsed.data.userId);
    return ok({ ok: true, established });
  } catch (error) {
    return failFromError(error, "Error establishing session:");
  }
}
