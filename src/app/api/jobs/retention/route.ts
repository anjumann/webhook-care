/**
 * Nightly retention sweep — deletes expired, unpinned requests.
 *
 * Triggered by a QStash **Schedule** (`0 0 * * *`, UTC), NOT publicly callable:
 * every request must carry a valid `Upstash-Signature` for the raw body. One
 * scheduled message/day keeps us inside the QStash free tier; the job itself
 * loops bounded `deleteMany` passes so it survives an endpoint with 100k+ rows.
 *
 * A Mongo TTL index on `expiresAt` (see `scripts/ensure-ttl-index.mjs`) is the
 * real safety net if this job ever stops running.
 *
 * Dry run (count only, no deletes): set `RETENTION_DRY_RUN=true` or POST with
 * `?dryRun=true`. Run it for a few nights before enabling real deletes.
 *
 * One-time schedule setup (replace APP_URL):
 *   curl -X POST https://qstash.upstash.io/v2/schedules \
 *     -H "Authorization: Bearer $QSTASH_TOKEN" \
 *     -H "Upstash-Cron: 0 0 * * *" \
 *     -H "Destination: $APP_URL/api/jobs/retention"
 */
import { NextRequest } from "next/server";
import { Receiver } from "@upstash/qstash";
import { deleteExpiredRequests } from "@/services/requests";
import { ok, unauthorized, fail, failFromError } from "@/lib/http";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
    const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;
    if (!currentSigningKey || !nextSigningKey) {
      return fail("Retention job not configured (missing QStash signing keys)", 503);
    }

    // Verify the QStash signature over the RAW body before doing any work.
    const body = await request.text();
    const signature = request.headers.get("upstash-signature") ?? "";
    const receiver = new Receiver({ currentSigningKey, nextSigningKey });
    const valid = await receiver
      .verify({ signature, body })
      .catch(() => false);
    if (!valid) return unauthorized("Invalid QStash signature");

    const dryRun =
      process.env.RETENTION_DRY_RUN === "true" ||
      new URL(request.url).searchParams.get("dryRun") === "true";

    const result = await deleteExpiredRequests({ dryRun });
    console.log("[retention] sweep complete", result);
    return ok(result);
  } catch (error) {
    return failFromError(error, "Error running retention sweep:");
  }
}
