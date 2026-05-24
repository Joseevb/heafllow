import { getAvatarPresignedUrl } from '@/lib/functions/avatar'

export async function uploadAvatar(file: File): Promise<string> {
  // Ask the server for a presigned URL
  const { uploadUrl, publicUrl } = await getAvatarPresignedUrl({
    data: {
      tempId: crypto.randomUUID(),
      contentType: file.type as 'image/jpeg' | 'image/png' | 'image/webp',
    },
  })

  // Upload directly to R2 from the browser
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  })

  if (!res.ok) throw new Error('Upload to R2 failed')

  return publicUrl // this is what gets saved to the DB
}
