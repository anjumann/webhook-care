import useSWR from 'swr';
import type { Endpoint, EndpointWithRequests } from '@/endpoints/types';
import { useSession } from '@/components/auth/session-provider';

// Fetcher function for SWR
const fetcher = async (url: string) => {
  const response = await fetch(url);
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
  const response = await fetch(`/api/endpoints/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete endpoint');
  }
  return response.json();
}

export function useGetEndpoint(id: string) {
  const { ready } = useSession();
  const { data, error, isLoading, mutate } = useSWR<EndpointWithRequests>(
    ready && id ? `/api/endpoints/${id}` : null,
    fetcher
  );

  return {
    endpoints: data,
    isLoading,
    isError: error,
    mutate,
  };
}

export async function getEndpoint(id: string) {
  const response = await fetch(`/api/endpoints/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch endpoint');
  }
  return response.json();
}


export async function deleteRequest(id: string) {
  const response = await fetch(`/api/requests/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete request');
  }
  return response.json();
}

export async function deleteAllRequests(endpointId: string) {
  const response = await fetch(`/api/requests?endpointId=${endpointId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete all requests');
  }
  return response.json();
}

