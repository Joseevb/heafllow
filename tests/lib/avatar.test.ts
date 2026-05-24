import type { ZodType } from 'zod'

import { beforeEach, describe, expect, mock, test } from 'bun:test'

import { makeMemoryStorageProvider } from '../../src/lib/storage/memory'
import { generateAvatarKey } from '../../src/lib/storage/keys'
import { setStorageProvider } from '../../src/lib/storage'

type Validator = Pick<ZodType<unknown>, 'parse'>
type ServerFnInput = { data?: unknown }

interface MockServerChain {
  inputValidator: (schema: Validator) => MockServerChain
  middleware: (middlewares: Array<unknown>) => MockServerChain
  handler: <TInput extends ServerFnInput, TResult>(
    handler: (input: TInput) => TResult | Promise<TResult>,
  ) => (input: TInput) => Promise<TResult>
}

const createServerFnMock = (): MockServerChain => {
  let validator: Validator | undefined

  const chain: MockServerChain = {
    inputValidator(schema) {
      validator = schema
      return chain
    },
    middleware() {
      return chain
    },
    handler(handler) {
      return async (input) => {
        validator?.parse(input.data)
        return await handler(input)
      }
    },
  }

  return chain
}

mock.module('@tanstack/react-start', () => ({
  createServerFn: createServerFnMock,
  createMiddleware: () => ({
    server: (handler: unknown) => handler,
  }),
}))

const { getAvatarPresignedUrl } = await import('../../src/lib/functions/avatar')

describe('avatar', () => {
  beforeEach(() => {
    setStorageProvider(makeMemoryStorageProvider())
  })

  test('getAvatarPresignedUrl returns memory upload and public URLs', async () => {
    const tempId = 'temp-avatar-1'

    const result = await getAvatarPresignedUrl({
      data: {
        tempId,
        contentType: 'image/png',
      },
    })

    const key = generateAvatarKey(tempId)

    expect(result).toEqual({
      uploadUrl: `memory://presigned/${key}`,
      publicUrl: `http://localhost:3000/${key}`,
    })
  })

  test('getAvatarPresignedUrl validates contentType', async () => {
    await expect(
      getAvatarPresignedUrl({
        data: {
          tempId: 'temp-avatar-2',
          contentType: 'image/gif',
        },
      }),
    ).rejects.toThrow()
  })
})
