import useSWR, { mutate as globalMutate } from 'swr'
import { guardedFetch } from '@/lib/guarded-fetch'

export interface Profile {
  userName?: string | null
  userImage?: string | null
  email?: string | null
}

/** Canonical SWR/cache key for a user's profile — shared by every consumer. */
export const profileKey = (userId?: string | null) =>
  userId ? `/api/user/profile?userId=${encodeURIComponent(userId)}` : null

const fetcher = async (url: string): Promise<Profile> => {
  const response = await guardedFetch(url)
  if (!response.ok) throw new Error('Failed to get profile')
  return response.json()
}

/**
 * Shared profile hook. Because every consumer (sidebar account footer, header,
 * settings page) reads the same key, a single `revalidateProfile()` after an
 * update refreshes all of them at once.
 *
 * `enabled` lets dashboard consumers wait for the session cookie (`ready`).
 */
export function useProfile(userId?: string | null, enabled = true) {
  const key = enabled ? profileKey(userId) : null
  const { data, error, isLoading, mutate } = useSWR<Profile>(key, fetcher, {
    shouldRetryOnError: false, // a 403 on public pages shouldn't spam retries
  })
  return { profile: data, isLoading, isError: error, mutate }
}

/** Revalidate the shared profile cache so all consumers update immediately. */
export const revalidateProfile = (userId?: string | null) =>
  globalMutate(profileKey(userId))

export const updateProfile = async (userId: string, userName: string, userImage: string) => {
  const response = await guardedFetch(`/api/user/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId, userName, userImage }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Failed to update profile')
  }

  // Push the fresh values into the shared cache so the sidebar/header update now.
  await globalMutate(profileKey(userId), data, { revalidate: false })

  return data
}

export const getProfile = async (userId: string) => {
  const response = await guardedFetch(
    `/api/user/profile?userId=${encodeURIComponent(userId)}`,
    { method: 'GET' }
  )

  if (!response.ok) {
    throw new Error('Failed to get profile')
  }

  return response.json()
}
