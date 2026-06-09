import { useEffect, useState } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { ulid } from 'ulid'

const DEFAULT_AVATAR = 'zoro.jpg'

/** Strip any leading `/avatar/` so we never double-prefix the path. */
export function toAvatarPath(file: string | undefined): string {
  const name = (file ?? DEFAULT_AVATAR).replace(/^\/?avatar\//, '')
  return `/avatar/${name}`
}

export function useUser() {
  const { get, set } = useLocalStorage<{ id: string; imageUrl: string }>('user')
  const [user, setUser] = useState<{ id: string; imageUrl: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let stored = get()
    if (!stored || !stored.id) {
      stored = { id: ulid(), imageUrl: DEFAULT_AVATAR }
      set(stored)
    }
    setUser(stored)
    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { id: user?.id, imageUrl: toAvatarPath(user?.imageUrl), loading }
}