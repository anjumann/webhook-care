/**
 * Pure, storage-agnostic helpers + shared types for the API client's saved
 * requests and auto-history. The actual persistence (IndexedDB) lives in
 * `api-client-db.ts`; keeping these pure makes them unit-testable and lets the
 * storage backend change without touching the list logic.
 *
 * Client-only by design (per the product decision to keep user-supplied auth
 * headers OFF our servers); records are namespaced by `userId` so distinct
 * anonymous identities on a shared browser don't collide.
 */

export interface HeaderPair {
  key: string;
  value: string;
}

export interface SavedRequest {
  id: string;
  name: string;
  method: string;
  url: string;
  headers: HeaderPair[];
  body: string;
  savedAt: number;
}

export interface HistoryEntry {
  id: string;
  method: string;
  url: string;
  headers: HeaderPair[];
  body: string;
  status: number | null;
  at: number;
}

export const HISTORY_CAP = 20;

/** Prepend `entry`, drop any earlier send to the same method+url, cap length. */
export function addToHistory(
  list: HistoryEntry[],
  entry: HistoryEntry,
  cap = HISTORY_CAP
): HistoryEntry[] {
  const key = `${entry.method} ${entry.url}`;
  const deduped = list.filter((h) => `${h.method} ${h.url}` !== key);
  return [entry, ...deduped].slice(0, cap);
}

/** Insert a new saved request, or replace the existing one with the same id. */
export function upsertSaved(
  list: SavedRequest[],
  req: SavedRequest
): SavedRequest[] {
  const exists = list.some((r) => r.id === req.id);
  const next = exists
    ? list.map((r) => (r.id === req.id ? req : r))
    : [req, ...list];
  return next.sort((a, b) => b.savedAt - a.savedAt);
}

export function removeById<T extends { id: string }>(
  list: T[],
  id: string
): T[] {
  return list.filter((r) => r.id !== id);
}

/** A short, stable id without pulling in a uuid dependency. */
export function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
