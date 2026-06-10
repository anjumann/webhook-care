/**
 * One-time (idempotent) setup: turn the `expiresAt` index into a MongoDB TTL
 * index so Mongo itself deletes expired requests even if the QStash retention
 * job ever stops running.
 *
 * Prisma can't express TTL options in `schema.prisma` for MongoDB, and Mongo
 * rejects a second index with the same key pattern — so we DROP the plain
 * `Request_expiresAt_idx` (created by `@@index([expiresAt])`) and recreate it
 * under the SAME name with `expireAfterSeconds: 0`. Reusing the name keeps
 * Prisma introspection happy (it tracks the name/keys, not the TTL option).
 *
 * Pinned requests have `expiresAt = null`, which a TTL index never deletes, so
 * the safety net respects pins automatically.
 *
 * Run:  node scripts/ensure-ttl-index.mjs   (or `npm run db:ttl-index`)
 * Needs a generated client (`prisma generate`) and DATABASE_URL.
 */
import { PrismaClient } from "../generated/prisma/client/index.js";

const prisma = new PrismaClient();
const INDEX = "Request_expiresAt_idx";

try {
  try {
    await prisma.$runCommandRaw({ dropIndexes: "Request", index: INDEX });
    console.log(`Dropped existing index ${INDEX}`);
  } catch (err) {
    // IndexNotFound (27) is fine — nothing to drop yet.
    if (err?.code !== 27 && !/index not found/i.test(String(err?.message))) throw err;
  }

  await prisma.$runCommandRaw({
    createIndexes: "Request",
    indexes: [{ key: { expiresAt: 1 }, name: INDEX, expireAfterSeconds: 0 }],
  });
  console.log(`Created TTL index ${INDEX} (expireAfterSeconds: 0)`);
} catch (err) {
  console.error("Failed to ensure TTL index:", err);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
