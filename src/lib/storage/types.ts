import type { Effect } from 'effect'

export interface UploadedFile {
  key: string
  url: string
  size: number
  contentType: string
}

export interface StorageProvider {
  upload(params: {
    key: string
    body: Buffer | Uint8Array
    contentType: string
  }): Effect.Effect<UploadedFile, StorageError>

  delete(key: string): Effect.Effect<void, StorageError>

  getUrl(key: string): string

  // For direct client-side uploads (presigned URLs)
  getPresignedUploadUrl(params: {
    key: string
    contentType: string
    expiresIn?: number
  }): Effect.Effect<string, StorageError>
}

export class StorageError {
  readonly _tag = 'StorageError'
  constructor(
    readonly message: string,
    readonly cause?: unknown,
  ) {}
}
