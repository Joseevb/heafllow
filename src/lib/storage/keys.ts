export const generateAvatarKey = (userId: string) => `avatars/pending/${userId}`

export const generateMediaKey = (userId: string, filename: string) =>
  `media/${userId}/${Date.now()}-${filename}`
