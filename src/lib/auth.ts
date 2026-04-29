import { APIError, betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { admin as adminPlugin } from 'better-auth/plugins'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { Result } from 'better-result'
import { toast } from 'sonner'

import { DeleteUserTemplate } from '@/components/email/delete-user-template'
import { db } from '@/db'
import * as schema from '@/db/schemas'
import { env } from '@/env/server'
import { softDeleteUser } from '@/lib/auth.functions'
import { sendEmail } from '@/lib/email.functions'
import { ac, admin, client, specialist } from '@/lib/permissions'

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
  plugins: [
    adminPlugin({
      ac,
      roles: { admin, client, specialist },
      defaultRole: 'client',
      adminRoles: ['admin'],
    }),
    tanstackStartCookies(),
  ],
  user: {
    deleteUser: {
      enabled: true,
      sendDeleteAccountVerification: async ({ user, url }) => {
        const serializedResult = await sendEmail({
          data: {
            to: user.email,
            subject: 'Delete Account Verification',
            react: DeleteUserTemplate({ name: user.name.split(' ')[0], url }),
          },
        })

        const result = Result.deserialize(serializedResult)

        result.match({
          ok: () => {
            console.log('Email sent successfully')
          },
          err: (err) => {
            toast.error('Failed to send delete account verification email. Please try again later.')
            console.error(err)
          },
        })
      },
      beforeDelete: async () => {
        // Anonymize the user in-place, then abort the real deletion
        const serializedResult = await softDeleteUser()

        const result = Result.deserialize(serializedResult)

        result.tapError((err) => {
          toast.error('Failed to delete user, please try again later.')
          console.error(err)
        })

        // Throwing APIError stops better-auth from proceeding with the DELETE
        throw new APIError('BAD_REQUEST', {
          message: 'User data has been anonymized',
        })
      },
    },
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
      phoneNumber: {
        type: 'string',
        required: true,
        index: true,
      },
      deletedAt: {
        type: 'date',
        required: false,
        input: false,
      },
    },
  },
  experimental: {
    joins: true,
  },
})
