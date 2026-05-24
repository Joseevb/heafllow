import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { Effect } from 'effect'

import type { StorageProvider, UploadedFile } from './types'

import { StorageError } from './types'

interface R2Config {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
  publicBaseUrl?: string
}

export function makeR2StorageProvider(config: R2Config): StorageProvider {
  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  })

  const getUrl = (key: string) =>
    config.publicBaseUrl
      ? `${config.publicBaseUrl}/${key}`
      : `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucket}/${key}`

  return {
    getUrl,

    upload: ({ key, body, contentType }) =>
      Effect.tryPromise({
        try: async () => {
          await client.send(
            new PutObjectCommand({
              Bucket: config.bucket,
              Key: key,
              Body: body,
              ContentType: contentType,
            }),
          )
          return {
            key,
            url: getUrl(key),
            size: body.byteLength,
            contentType,
          } satisfies UploadedFile
        },
        catch: (cause) => new StorageError(`Failed to upload ${key}`, cause),
      }),

    delete: (key) =>
      Effect.tryPromise({
        try: () => client.send(new DeleteObjectCommand({ Bucket: config.bucket, Key: key })),
        catch: (cause) => new StorageError(`Failed to delete ${key}`, cause),
      }).pipe(Effect.map(() => undefined)),

    getPresignedUploadUrl: ({ key, contentType, expiresIn = 300 }) =>
      Effect.tryPromise({
        try: () =>
          getSignedUrl(
            client,
            new PutObjectCommand({
              Bucket: config.bucket,
              Key: key,
              ContentType: contentType,
            }),
            { expiresIn },
          ),
        catch: (cause) => new StorageError('Failed to generate presigned URL', cause),
      }),
  }
}
