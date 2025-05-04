import { useEffect, useState } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { ulid } from 'ulid'

export function useUser() {
  const { get, set } = useLocalStorage<{ id: string }>('user')
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let user = get()
    if (!user || !user.id) {
      const newUser = { id: ulid() }
      set(newUser)
      user = newUser
    }
    setUser(user)
    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { user, loading }
} 