/**
 * One-time (idempotent) setup: create the `User.email` unique index as a
 * **partial** index so uniqueness is enforced only among users who actually
 * have an email.
 *
 * Why this can't live in `schema.prisma`: `email String? @unique` makes Prisma
 * build a plain (non-sparse) unique index on `{ email: 1 }`. On MongoDB a
 * missing/`null` field still counts as a value, so with many anonymous users
 * (all `email: null`) `prisma db push` fails to build it
 * (`E11000 dup key … email: null`) — and even if it built, it would wrongly
 * allow only ONE null-email (anonymous) user. The correct semantics: enforce
 * uniqueness only when `email` is a string.
 *
 * Prisma's MongoDB connector can't express `partialFilterExpression`, so we
 * pre-create the index under the SAME name + key Prisma expects
 * (`User_email_key` / `{ email: 1 }`). `prisma db push` then sees a matching
 * index and skips it (it tracks name/keys/unique, not the partial filter) —
 * the same trick `ensure-ttl-index.mjs` uses for the TTL option.
 *
 * Run:  node scripts/ensure-email-index.mjs   (or `npm run db:email-index`)
 * Needs a generated client (`prisma generate`) and DATABASE_URL.
 */
import { PrismaClient } from "../generated/prisma/client/index.js";

const prisma = new PrismaClient();
const INDEX = "User_email_key";

try {
  // Drop any prior attempt (e.g. a half-built plain unique index) so we can
  // (re)create it as partial. IndexNotFound is fine.
  try {
    await prisma.$runCommandRaw({ dropIndexes: "User", index: INDEX });
    console.log(`Dropped existing index ${INDEX}`);
  } catch (err) {
    if (err?.code !== 27 && !/index not found/i.test(String(err?.message))) throw err;
  }

  await prisma.$runCommandRaw({
    createIndexes: "User",
    indexes: [
      {
        key: { email: 1 },
        name: INDEX,
        unique: true,
        // Only index docs where email is a string → many null-email users
        // coexist; two users can't share the same real email.
        partialFilterExpression: { email: { $type: "string" } },
      },
    ],
  });
  console.log(`Created partial unique index ${INDEX} (email is a string)`);
} catch (err) {
  console.error("Failed to ensure email index:", err);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
