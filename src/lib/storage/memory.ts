import { Effect } from 'effect'

import type { StorageProvider, UploadedFile } from './types'

export function makeMemoryStorageProvider(): StorageProvider & {
  _store: Map<string, { data: Buffer; contentType: string }>
} {
  const store = new Map<string, { data: Buffer; contentType: string }>()

  return {
    _store: store,

    getUrl: (key) => `memory://${key}`,

    upload: ({ key, body, contentType }) =>
      Effect.sync(() => {
        store.set(key, { data: Buffer.from(body), contentType })
        return {
          key,
          url: `memory://${key}`,
          size: body.byteLength,
          contentType,
        } satisfies UploadedFile
      }),

    delete: (key) =>
      Effect.sync(() => {
        store.delete(key)
      }),

    getPresignedUploadUrl: ({ key }) => Effect.succeed(`memory://presigned/${key}`),
  }
}
