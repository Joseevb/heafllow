import type { StorageProvider } from './types'

import { makeMemoryStorageProvider } from './memory'
import { makeR2StorageProvider } from './r2'

let _provider: StorageProvider | null = null

export function getStorageProvider(): StorageProvider {
  if (!_provider) {
    if (process.env.NODE_ENV === 'test') {
      _provider = makeMemoryStorageProvider()
    } else {
      _provider = makeR2StorageProvider({
        accountId: process.env.CF_ACCOUNT_ID!,
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
        bucket: process.env.R2_BUCKET!,
        publicBaseUrl: process.env.R2_PUBLIC_BASE_URL,
      })
    }
  }
  return _provider
}

// For tests — reset between test cases
export function setStorageProvider(provider: StorageProvider) {
  _provider = provider
}

export type { StorageProvider, UploadedFile, StorageError } from './types'
