import { createServerFn } from '@tanstack/react-start'
import { Effect } from 'effect'
import * as z from 'zod'

import { env } from '@/env/client'
import { getStorageProvider } from '@/lib/storage'
import { generateAvatarKey } from '@/lib/storage/keys'

const inputSchema = z.object({
  tempId: z.string(),
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
})

export const getAvatarPresignedUrl = createServerFn({ method: 'GET' })
  .inputValidator(inputSchema)
  .handler(async ({ data }) => {
    const storage = getStorageProvider()
    const key = generateAvatarKey(data.tempId)

    const effect = storage
      .getPresignedUploadUrl({
        key,
        contentType: data.contentType,
      })
      .pipe(Effect.catchAll(() => Effect.fail(new Error('Could not generate upload URL'))))

    const result = await Effect.runPromise(effect)

    return { uploadUrl: result, publicUrl: `${env.VITE_R2_PUBLIC_BASE_URL}${key}` }
  })
