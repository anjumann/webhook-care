import { useEffect, useState } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { ulid } from 'ulid'
import { avatarFiles } from '@/constant'

export function useUser() {
  const { get, set } = useLocalStorage<{ id: string, imageUrl: string }>('user')
  const [user, setUser] = useState<{ id: string, imageUrl: string } | null>(null)
  const [loading, setLoading] = useState(true)


  const randomAvatar = avatarFiles[Math.floor(Math.random() * avatarFiles.length)];

  useEffect(() => {
    let user = get()
    if (!user || !user.id) {
      const newUser = { id: ulid(), imageUrl: `/avatar/${randomAvatar}` }
      set(newUser)
      user = newUser
    }
    setUser(user)
    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { id: user?.id, imageUrl: `/avatar/${user?.imageUrl}`, loading }
} 