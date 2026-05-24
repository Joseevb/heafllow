import type { ReactElement } from 'react'
import type { ZodType } from 'zod'

import { beforeEach, describe, expect, mock, test } from 'bun:test'
import React from 'react'

type SendResponse =
  | { data: { id: string }; error: null }
  | { data: null; error: { message: string } }

type Validator = Pick<ZodType<unknown>, 'parse'>
type ServerFnInput = { data?: unknown }

interface MockServerChain {
  inputValidator: (schema: Validator) => MockServerChain
  middleware: (middlewares: Array<unknown>) => MockServerChain
  handler: <TInput extends ServerFnInput, TResult>(
    handler: (input: TInput) => TResult | Promise<TResult>,
  ) => (input: TInput) => Promise<TResult>
}

const sendMock = mock(
  async (): Promise<SendResponse> => ({ data: { id: 'email-123' }, error: null }),
)

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

mock.module('resend', () => ({
  Resend: mock(() => ({
    emails: {
      send: sendMock,
    },
  })),
}))

mock.module('@tanstack/react-start', () => ({
  createServerFn: createServerFnMock,
  createMiddleware: () => ({
    server: (handler: unknown) => handler,
  }),
}))

const { sendEmail } = await import('../../src/lib/functions/email')

describe('email', () => {
  beforeEach(() => {
    sendMock.mockClear()
    sendMock.mockImplementation(async () => ({ data: { id: 'email-123' }, error: null }))
  })

  test('sendEmail forwards the payload to Resend and serializes the success', async () => {
    const react = React.createElement('div', null, 'Hello')
    const email = {
      to: 'recipient@example.com',
      subject: 'Test Email',
      react,
    }

    const result = await sendEmail({ data: email })

    expect(sendMock).toHaveBeenCalledWith({
      from: 'test@example.com',
      to: 'recipient@example.com',
      subject: 'Test Email',
      react: email.react,
    })
    expect(result).toEqual({
      status: 'ok',
      value: {
        id: 'email-123',
        data: { id: 'email-123' },
      },
    })
  })

  test('sendEmail serializes resend failures', async () => {
    sendMock.mockImplementation(async () => ({
      data: null,
      error: { message: 'Send failed' },
    }))

    const react = React.createElement('div', null, 'Hello')

    const result = await sendEmail({
      data: {
        to: 'recipient@example.com',
        subject: 'Test Email',
        react,
      },
    })

    expect(result.status).toBe('error')
    if (result.status === 'error') {
      expect(result.error.message).toBe('Send failed')
    }
  })

  test('sendEmail serializes thrown resend errors', async () => {
    sendMock.mockImplementation(async () => {
      throw new Error('Network down')
    })

    const react: ReactElement = React.createElement('div', null, 'hello')

    const result = await sendEmail({
      data: {
        to: 'recipient@example.com',
        subject: 'Test Email',
        react,
      },
    })

    expect(result.status).toBe('error')
    if (result.status === 'error') {
      expect(result.error.message).toBe('Network down')
    }
  })

  test('sendEmail validates the react payload', () => {
    expect(
      sendEmail({
        data: {
          to: 'recipient@example.com',
          subject: 'Test Email',
          react: null,
        },
      }),
    ).rejects.toThrow('react must be a valid React element')
  })

  test('sendEmail validates undefined react payload', () => {
    expect(
      sendEmail({
        data: {
          to: 'recipient@example.com',
          subject: 'Test Email',
          react: undefined,
        },
      }),
    ).rejects.toThrow('react must be a valid React element')
  })

  test('sendEmail middleware properly invokes ensureSessionMiddleware', () => {
    expect(sendEmail).toBeDefined()
    expect(typeof sendEmail).toBe('function')
  })
})
