export const updateProfile = async (userId: string, userName: string, userImage: string) => {
  const response = await fetch(`/api/user/profile`, {
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

  return data
}

export const getProfile = async (userId: string) => {
  const response = await fetch(`/api/user/profile?userId=${userId}  `, {
    method: 'GET',
  })

  if (!response.ok) {
    throw new Error('Failed to get profile')
  }

  return response.json()
}
