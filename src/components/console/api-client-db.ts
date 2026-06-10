"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  addToHistory,
  makeId,
  removeById,
  upsertSaved,
  HISTORY_CAP,
  type HistoryEntry,
  type SavedRequest,
} from "./api-client-store";

/**
 * IndexedDB-backed persistence for the API client. Durable (we also request
 * `navigator.storage.persist()` so the browser won't evict it under pressure),
 * roomy (fine for many saved requests + future response snapshots), and
 * client-only — auth headers never touch our servers. Records carry `userId`
 * so identities on a shared browser stay isolated.
 *
 * A small hand-rolled wrapper (no `idb` dependency). All I/O fails soft: if
 * IndexedDB is unavailable (SSR, private mode, disabled), reads return [] and
 * writes no-op, so the client still works as an ephemeral scratch tool.
 */

const DB_NAME = "wcat-api-client";
const DB_VERSION = 1;
const SAVED = "saved";
const HISTORY = "history";

type WithUser<T> = T & { userId: string };

function openDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === "undefined") return resolve(null);
    let req: IDBOpenDBRequest;
    try {
      req = indexedDB.open(DB_NAME, DB_VERSION);
    } catch {
      return resolve(null);
    }
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(SAVED))
        db.createObjectStore(SAVED, { keyPath: "id" });
      if (!db.objectStoreNames.contains(HISTORY))
        db.createObjectStore(HISTORY, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

function run<T>(
  store: string,
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest
): Promise<T | null> {
  return openDB().then(
    (db) =>
      new Promise<T | null>((resolve) => {
        if (!db) return resolve(null);
        try {
          const t = db.transaction(store, mode);
          const r = fn(t.objectStore(store));
          r.onsuccess = () => resolve(r.result as T);
          r.onerror = () => resolve(null);
        } catch {
          resolve(null);
        }
      })
  );
}

async function getAllForUser<T extends { userId: string }>(
  store: string,
  userId: string
): Promise<T[]> {
  const all = (await run<T[]>(store, "readonly", (s) => s.getAll())) ?? [];
  return all.filter((r) => r.userId === userId);
}

/** Make the IndexedDB store match `next` exactly (delete dropped, put present). */
async function reconcile<T extends { id: string }>(
  store: string,
  userId: string,
  next: T[]
): Promise<void> {
  const prev = await getAllForUser<WithUser<T>>(store, userId);
  const keep = new Set(next.map((r) => r.id));
  await Promise.all(
    prev
      .filter((r) => !keep.has(r.id))
      .map((r) => run(store, "readwrite", (s) => s.delete(r.id)))
  );
  await Promise.all(
    next.map((r) => run(store, "readwrite", (s) => s.put({ ...r, userId })))
  );
}

export function useApiClientStore(userId: string) {
  const [saved, setSaved] = useState<SavedRequest[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Refs mirror state so mutators compute the next list without stale closures.
  const savedRef = useRef<SavedRequest[]>([]);
  const historyRef = useRef<HistoryEntry[]>([]);
  savedRef.current = saved;
  historyRef.current = history;

  useEffect(() => {
    let active = true;
    (async () => {
      // Ask the browser to keep our storage (best-effort; ignore the result).
      try {
        await navigator.storage?.persist?.();
      } catch {
        /* not supported — fine */
      }
      const [s, h] = await Promise.all([
        getAllForUser<WithUser<SavedRequest>>(SAVED, userId),
        getAllForUser<WithUser<HistoryEntry>>(HISTORY, userId),
      ]);
      if (!active) return;
      setSaved([...s].sort((a, b) => b.savedAt - a.savedAt));
      setHistory([...h].sort((a, b) => b.at - a.at).slice(0, HISTORY_CAP));
      setHydrated(true);
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  const saveRequest = useCallback(
    (req: Omit<SavedRequest, "id" | "savedAt"> & { id?: string }) => {
      const full: SavedRequest = {
        ...req,
        id: req.id ?? makeId(),
        savedAt: Date.now(),
      };
      const next = upsertSaved(savedRef.current, full);
      setSaved(next);
      void reconcile(SAVED, userId, next);
      return full;
    },
    [userId]
  );

  const deleteSaved = useCallback(
    (id: string) => {
      const next = removeById(savedRef.current, id);
      setSaved(next);
      void reconcile(SAVED, userId, next);
    },
    [userId]
  );

  const pushHistory = useCallback(
    (entry: Omit<HistoryEntry, "id" | "at">) => {
      const full: HistoryEntry = { ...entry, id: makeId(), at: Date.now() };
      const next = addToHistory(historyRef.current, full);
      setHistory(next);
      void reconcile(HISTORY, userId, next);
    },
    [userId]
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
    void reconcile(HISTORY, userId, []);
  }, [userId]);

  return {
    saved,
    history,
    hydrated,
    saveRequest,
    deleteSaved,
    pushHistory,
    clearHistory,
  };
}
