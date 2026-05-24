import { afterAll, beforeEach, describe, expect, mock, test } from 'bun:test'

const getAvatarPresignedUrlMock = mock(async (_input: unknown) => ({
  uploadUrl: 'memory://presigned/avatars/pending/fixed-id',
  publicUrl: 'http://localhost:3000/avatars/pending/fixed-id',
}))

const fetchMock = mock(async () => new Response(null, { status: 200 }))

mock.module('@/lib/functions/avatar', () => ({
  getAvatarPresignedUrl: getAvatarPresignedUrlMock,
}))

const originalFetch = globalThis.fetch
const originalRandomUUID = crypto.randomUUID

globalThis.fetch = fetchMock as typeof fetch
crypto.randomUUID = () => 'fixed-id'

const { uploadAvatar } = await import('../../src/lib/storage/client')

describe('storage client', () => {
  beforeEach(() => {
    getAvatarPresignedUrlMock.mockClear()
    fetchMock.mockClear()

    getAvatarPresignedUrlMock.mockImplementation(async () => ({
      uploadUrl: 'memory://presigned/avatars/pending/fixed-id',
      publicUrl: 'http://localhost:3000/avatars/pending/fixed-id',
    }))
    fetchMock.mockImplementation(async () => new Response(null, { status: 200 }))
  })

  test('uploadAvatar requests a presigned URL and uploads the file', async () => {
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' })

    const result = await uploadAvatar(file)

    expect(getAvatarPresignedUrlMock).toHaveBeenCalledWith({
      data: {
        tempId: 'fixed-id',
        contentType: 'image/png',
      },
    })
    expect(fetchMock).toHaveBeenCalledWith('memory://presigned/avatars/pending/fixed-id', {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': 'image/png' },
    })
    expect(result).toBe('http://localhost:3000/avatars/pending/fixed-id')
  })

  test('uploadAvatar throws when the upload request fails', async () => {
    fetchMock.mockImplementation(async () => new Response(null, { status: 500 }))

    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' })

    await expect(uploadAvatar(file)).rejects.toThrow('Upload to R2 failed')
  })
})

afterAll(() => {
  globalThis.fetch = originalFetch
  crypto.randomUUID = originalRandomUUID
})
