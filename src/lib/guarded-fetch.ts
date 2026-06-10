/**
 * Client-side `fetch` wrapper that fans out a notification whenever a guarded
 * route rejects the caller as unauthenticated (HTTP 401). The UI subscribes via
 * `onUnauthorized` to surface a sign-in prompt instead of a dead-end toast.
 *
 * Deliberately framework-free (a plain subscriber registry, not `window`
 * events) so it's unit-testable in the `node` test env and has no listeners on
 * pages where no provider is mounted (e.g. public marketing pages) — there a
 * 401 is simply a no-op.
 */

type UnauthorizedListener = () => void;

const listeners = new Set<UnauthorizedListener>();

/** Subscribe to 401s from {@link guardedFetch}. Returns an unsubscribe fn. */
export function onUnauthorized(listener: UnauthorizedListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Notify subscribers that a guarded request was rejected as unauthenticated. */
export function notifyUnauthorized(): void {
  for (const listener of listeners) listener();
}

/**
 * `fetch` drop-in that flags 401 responses. Callers keep their existing
 * `if (!res.ok)` handling — this only notifies on 401; it never throws and
 * never mutates the response.
 */
export async function guardedFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const res = await fetch(input, init);
  if (res.status === 401) notifyUnauthorized();
  return res;
}
