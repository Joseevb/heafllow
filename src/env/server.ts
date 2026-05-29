import { createEnv } from '@t3-oss/env-core'
import * as z from 'zod'

export const env = createEnv({
  skipValidation: process.env.SKIP_ENV_VALIDATION === 'true',
  server: {
    SERVER_URL: z.url().optional(),
    DATABASE_URL: z.url().nonempty().nonoptional(),
    DATABASE_AUTH_TOKEN: z.string().optional(),
    BETTER_AUTH_SECRET: z.string().nonempty(),
    BETTER_AUTH_URL: z.url(),

    GOOGLE_CLIENT_ID: z.string().nonempty().nonoptional(),
    GOOGLE_CLIENT_SECRET: z.string().nonempty().nonoptional(),

    RESEND_API_KEY: z.string().nonempty().nonoptional(),
    RESEND_EMAIL_FROM: z.string().nonempty().nonoptional(),

    STRIPE_SECRET_KEY: z.string().nonempty().nonoptional(),
    STRIPE_WEBHOOK_SECRET: z.string().nonempty().nonoptional(),
    STRIPE_MONTHLY_PRICE_ID: z.string().nonempty().nonoptional(),
    STRIPE_YEARLY_PRICE_ID: z.string().nonempty().nonoptional(),

    SESSION_SECRET: z.string().min(32).nonempty().nonoptional(),

    NODE_ENV: z.enum(['development', 'production']).nonoptional().default('development'),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
  isServer: true,
})
