import type { ReactNode } from 'react'

import { createServerFn } from '@tanstack/react-start'
import { Result, TaggedError } from 'better-result'
import { Resend } from 'resend'
import * as z from 'zod'

import { env } from '@/env/server'
import { ensureSessionMiddleware } from '@/lib/auth.functions'
import { safeSerialize } from '@/lib/result'

const resend = new Resend(env.RESEND_API_KEY)

const sendEmailSchema = z.object({
  to: z.email(),
  subject: z.string().min(1).max(998),
  react: z.custom<ReactNode>((val) => {
    return val != null
  }, 'react must be a valid React element'),
})

class EmailSendError extends TaggedError('EmailSendError')<{
  message: string
  cause: unknown
}>() {}

export const sendEmail = createServerFn({ method: 'POST' })
  .inputValidator(sendEmailSchema)
  .middleware([ensureSessionMiddleware])
  .handler(async ({ data: params }) =>
    Result.tryPromise({
      try: async () => {
        const res = await resend.emails.send({
          from: env.RESEND_EMAIL_FROM,
          to: params.to,
          subject: params.subject,
          react: params.react,
        })

        if (res.error) {
          throw new Error(res.error.message)
        }

        return { id: res.data?.id, data: res.data }
      },
      catch: (cause) =>
        new EmailSendError({
          message: cause instanceof Error ? cause.message : 'Failed to send',
          cause,
        }),
    }).then(safeSerialize),
  )
