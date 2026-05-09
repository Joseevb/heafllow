import type { AnyUseMutationOptions } from '@tanstack/react-query'

import { useMutation } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Result } from 'better-result'
import { Activity } from 'react'

import type { SignUp } from '@/schemas/auth'

import SocialSignOn from '@/components/social-sign-on'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useAppForm } from '@/hooks/form'
import { formOpts, SignUpForm } from '@/routes/auth/-components/sign-up-form'
import { updateSignUpSession } from '@/session/onboarding-session'

export const Route = createFileRoute('/auth/sign-up/')({
  component: RouteComponent,
})

const mutationOptions = {
  mutationKey: ['sign-up'],
  mutationFn: async ({ value }: { value: SignUp }) => {
    const serializedRes = await updateSignUpSession({
      data: {
        accountData: value,
        state: 'email',
      },
    })

    const res = Result.deserialize(serializedRes)

    if (res.isErr()) {
      throw new Error('Failed to create account')
    }
  },
} satisfies AnyUseMutationOptions

function RouteComponent() {
  const router = useRouter()

  const { mutateAsync, isError, error } = useMutation<void, Error, { value: SignUp }>({
    ...mutationOptions,
    onSuccess: async () => await router.navigate({ to: '/auth/sign-up/user-data' }),
  })

  const form = useAppForm({
    ...formOpts,
    onSubmit: mutateAsync,
  })

  return (
    <div className="container grid min-h-screen min-w-screen place-items-center">
      <Card className="relative w-full max-w-md [view-transition-name:auth-card]">
        <CardHeader>
          <CardTitle>Sign Un</CardTitle>
          <CardDescription>Create a New Account</CardDescription>
          <div className="my-2">
            <SocialSignOn callbackUrl="/auth/sign-up/user-data" />
          </div>
          <Separator className="mt-2" />
        </CardHeader>
        <CardContent>
          <Activity mode={isError ? 'visible' : 'hidden'}>
            <Alert variant="destructive" className="my-5">
              <AlertTitle>Error!</AlertTitle>
              <AlertDescription>An error occurred: {error?.message}</AlertDescription>
            </Alert>
          </Activity>
          <SignUpForm form={form} />
        </CardContent>
      </Card>
    </div>
  )
}
