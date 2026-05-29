import { stripe } from '@better-auth/stripe'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { betterAuth } from 'better-auth/minimal'
import { admin as adminPlugin } from 'better-auth/plugins'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { Stripe } from 'stripe'

import { db } from '@/db'
import * as schema from '@/db/schemas'
import { env } from '@/env/server'
import { ac, admin, client, specialist } from '@/lib/permissions'

const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-05-27.dahlia',
})

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'sqlite', schema, usePlural: true }),
  baseURL: env.BETTER_AUTH_URL,
  emailAndPassword: { enabled: true },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      mapProfileToUser: (profile) => ({
        firstName: profile.given_name,
        lastName: profile.family_name,
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
    stripe({
      stripeClient,
      stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET,
      createCustomerOnSignUp: true,
      subscription: {
        enabled: true,
        plans: [
          {
            name: 'monthly',
            priceId: env.STRIPE_MONTHLY_PRICE_ID,
          },
          {
            name: 'yearly',
            priceId: env.STRIPE_YEARLY_PRICE_ID,
          },
        ],
      },
    }),
    tanstackStartCookies(),
  ],
  account: {
    storeStateStrategy: 'database',
    skipStateCookieCheck: true,
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          try {
            const result = {
              data: { ...user, onboardingComplete: user.onboardingComplete ?? false },
            }
            return result
          } catch (err) {
            console.error('[DB HOOK ERROR]', err)
            console.error('[DB HOOK USER]', Object.keys(user))
            throw err
          }
        },
      },
    },
  },
  user: {
    deleteUser: {
      enabled: true,
      sendDeleteAccountVerification: async ({ user, url }) => {
        const { Result } = await import('better-result')
        const { toast } = await import('sonner')
        const { DeleteUserTemplate } = await import('@/components/email/delete-user-template')
        const { sendEmail } = await import('@/lib/functions/email')

        const result = Result.deserialize(
          await sendEmail({
            data: {
              to: user.email,
              subject: 'Delete Account Verification',
              react: DeleteUserTemplate({ name: user.name.split(' ')[0], url }),
            },
          }),
        )

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
        const { APIError } = await import('better-auth')
        const { Result } = await import('better-result')
        const { toast } = await import('sonner')
        const { softDeleteUser } = await import('@/lib/functions/auth')

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
      deletedAt: {
        type: 'date',
        required: false,
        input: false,
      },
      onboardingComplete: {
        type: 'boolean',
        required: false,
        default: false,
        input: false,
      },
    },
  },
})
