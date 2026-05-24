import { mutationOptions } from '@tanstack/react-query'

import type { SignIn, SignUp, UserDataInput } from '@/schemas/auth'
import type { SocialSignOnProvider } from '@/types/auth'

import { signIn } from '@/lib/auth-client'
import { signUpUser } from '@/lib/functions/auth'
import { createUrl } from '@/lib/utils'

export const signUpMutationOptions = mutationOptions({
  mutationKey: ['sign-up'],
  mutationFn: async ({ value }: { value: SignUp }) => {
    const result = await signUpUser({
      data: { step: 'account', accountData: value },
    })

    if (!result.success) throw new Error('Failed to save account data')
  },
})

export const signInMutationOptions = mutationOptions({
  mutationFn: async ({ value }: { value: SignIn }) => {
    const result = await signIn.email({
      callbackURL: '/dashboard',
      ...value,
    })

    if (result.error) {
      throw new Error(result.error.message || 'Sign in failed')
    }
  },
  mutationKey: ['signIn'],
})

export const userDataMutationOptions = mutationOptions({
  mutationKey: ['sign-up-user-data'],
  mutationFn: async ({ value }: { value: UserDataInput }) => {
    const result = await signUpUser({ data: { step: 'user-data', userData: value } })

    if (!result.success) throw new Error('Failed to save user data')
  },
})

export const socialSignOnMutationOptions = mutationOptions({
  mutationKey: ['social-sign-on'],
  mutationFn: async (provider: SocialSignOnProvider) => {
    if (provider.onClick) {
      provider.onClick()
      return
    }

    signIn.social({
      provider: provider.name,
      callbackURL: createUrl('/auth/callback/social'),
    })
  },
})
