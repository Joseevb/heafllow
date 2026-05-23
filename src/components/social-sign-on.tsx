import { useMutation } from '@tanstack/react-query'
import { Image } from '@unpic/react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { socialSignOnMutationOptions } from '@/queries/auth-queries'

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

export default function SocialSignOn() {
  const mutation = useMutation({
    ...socialSignOnMutationOptions,
    onError: (err) => {
      console.error('Error signign in: ', err)
      toast.error(normalizeErrorMessage(err))
    },
  })

  return (
    <div className="space-y-2">
      {socialSignOnProviders.map((provider) => {
        const isLoading = mutation.isPending && mutation.variables?.name === provider.name

        return (
          <Button
            key={provider.name}
            variant="outline"
            className="w-full gap-2"
            disabled={isLoading}
            onClick={() => mutation.mutate(provider)}
          >
            <Image src={provider.imageUrl} alt={`${provider.name} logo`} width={16} height={16} />
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
