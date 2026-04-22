import { useMutation } from '@tanstack/react-query'
import { Image } from '@unpic/react'
import { toast } from 'sonner'

import type { RoutePath } from '@/types/routes'

import { Button } from '@/components/ui/button'
import { signIn as defaultSignIn } from '@/lib/auth-client'

import type { SocialSignOnProvider } from '../types/auth'

const normalizeErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Failed to sign in'

export const socialSignOnProviders: Array<SocialSignOnProvider> = [
  {
    name: 'google',
    imageUrl: '/google.svg',
  },
  {
    name: 'apple',
    imageUrl: '/apple.svg',
    onClick: () => toast.error('Apple sign in is not implemented yet'),
  },
]

interface SocialSignOnProps {
  signIn?: typeof defaultSignIn
  callbackUrl?: RoutePath
}

// Internal mutation hook
function useSocialSignOn(
  signIn: typeof defaultSignIn,
  callbackUrl?: RoutePath,
) {
  return useMutation({
    mutationFn: async (provider: SocialSignOnProvider) => {
      if (provider.onClick) {
        provider.onClick()
        return
      }

      signIn.social({
        provider: provider.name,
        callbackURL: callbackUrl || '/',
      })
    },
    onError: (error) => {
      toast.error(normalizeErrorMessage(error))
    },
  })
}

export default function SocialSignOn({
  signIn = defaultSignIn,
  callbackUrl,
}: SocialSignOnProps) {
  const mutation = useSocialSignOn(signIn, callbackUrl)

  return (
    <div className="space-y-2">
      {socialSignOnProviders.map((provider) => {
        const isLoading =
          mutation.isPending && mutation.variables?.name === provider.name

        return (
          <Button
            key={provider.name}
            variant="outline"
            className="w-full gap-2"
            disabled={isLoading}
            onClick={() => mutation.mutate(provider)}
          >
            <Image
              src={provider.imageUrl}
              alt={`${provider.name} logo`}
              width={16}
              height={16}
            />
            <div>
              <span>Continue with </span>
              <span className="capitalize">{provider.name}</span>
            </div>
          </Button>
        )
      })}
    </div>
  )
}
