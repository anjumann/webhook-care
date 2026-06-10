import { destroySession } from "@/services/auth";
import { ok, failFromError } from "@/lib/http";

export async function POST() {
  try {
    await destroySession();
    return ok({ ok: true });
  } catch (error) {
    return failFromError(error, "Error logging out:");
  }
}
