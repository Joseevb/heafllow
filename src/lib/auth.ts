import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { admin } from 'better-auth/plugins'
import { tanstackStartCookies } from 'better-auth/tanstack-start'

import { db } from '@/db'
import * as schema from '@/db/schemas'
import { env } from '@/env/server'

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'sqlite', schema, usePlural: true }),
  baseURL: env.BETTER_AUTH_URL,
  emailAndPassword: { enabled: true },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      mapProfileToUser: (profile) => ({
        firstName: profile.name.split(' ')[0],
        lastName: profile.name.split(' ')[1],
      }),
    },
  },
  plugins: [admin(), tanstackStartCookies()],
  user: {
    deleteUser: {}, // TODO: Add logic for deleting users. See [TODO for more info](TODO.local.md#delete-user)
    additionalFields: {
      firstName: {
        type: 'string',
        required: true,
        index: true,
      },
      lastName: {
        type: 'string',
        required: true,
        index: true,
      },
    },
  },
})
