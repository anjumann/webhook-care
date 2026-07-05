import useSWR from 'swr';
import type { Endpoint, EndpointWithRequests, RequestRecord } from '@/endpoints/types';
import { useSession } from '@/components/auth/session-provider';
import { guardedFetch } from '@/lib/guarded-fetch';

// Fetcher function for SWR
const fetcher = async (url: string) => {
  const response = await guardedFetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch endpoints');
  }
  return response.json();
};

export function useEndpoints(userId: string) {
  // Wait for the anonymous session cookie before hitting guarded routes.
  const { ready } = useSession();
  const { data, error, isLoading, mutate } = useSWR<Endpoint[]>(
    ready && userId ? `/api/endpoints?userId=${userId}` : null,
    fetcher
  );

  return {
    endpoints: data,
    isLoading,
    isError: error,
    mutate,
  };
}

export async function deleteEndpoint(id: string) {
  const response = await guardedFetch(`/api/endpoints/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete endpoint');
  }
  return response.json();
}

export function useGetEndpoint(id: string, search?: string) {
  const { ready } = useSession();
  // Server-side search: the term is part of the SWR key, so changing it refetches
  // a fresh first page (never filters a loaded page client-side).
  const q = search?.trim();
  const key = ready && id
    ? `/api/endpoints/${id}${q ? `?search=${encodeURIComponent(q)}` : ""}`
    : null;
  const { data, error, isLoading, mutate } = useSWR<EndpointWithRequests>(
    key,
    fetcher
  );

  return {
    endpoints: data,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Fetch one more page of an endpoint's requests (cursor pagination), optionally
 * filtered by the same search term. Used by the detail page's "Load more".
 */
export async function fetchRequestPage(
  id: string,
  opts: { cursor: string; search?: string; limit?: number }
): Promise<{ requests: RequestRecord[]; nextCursor: string | null }> {
  const sp = new URLSearchParams({ cursor: opts.cursor });
  if (opts.limit) sp.set("limit", String(opts.limit));
  const q = opts.search?.trim();
  if (q) sp.set("search", q);
  const response = await guardedFetch(`/api/endpoints/${id}?${sp.toString()}`);
  if (!response.ok) throw new Error("Failed to load more requests");
  const data = (await response.json()) as EndpointWithRequests;
  return { requests: data.requests ?? [], nextCursor: data.nextCursor ?? null };
}

export async function getEndpoint(id: string) {
  const response = await guardedFetch(`/api/endpoints/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch endpoint');
  }
  return response.json();
}


export async function deleteRequest(id: string) {
  const response = await guardedFetch(`/api/requests/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete request');
  }
  return response.json();
}

export interface ReplayTargetResult {
  url: string;
  ok: boolean;
  status?: number;
  error?: string;
}

/** Replay a captured request to its endpoint's forwarding target(s). */
export async function replayRequest(id: string): Promise<ReplayTargetResult[]> {
  const response = await guardedFetch(`/api/requests/${id}/replay`, {
    method: 'POST',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Failed to replay request');
  }
  return (data.results ?? []) as ReplayTargetResult[];
}

export async function setRequestPinned(id: string, pinned: boolean) {
  const response = await guardedFetch(`/api/requests/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pinned }),
  });
  if (!response.ok) {
    throw new Error('Failed to update request');
  }
  return response.json();
}

export async function deleteAllRequests(endpointId: string) {
  const response = await guardedFetch(`/api/requests?endpointId=${endpointId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete all requests');
  }
  return response.json();
}

