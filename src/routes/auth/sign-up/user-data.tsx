import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Activity } from 'react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useAppForm } from '@/hooks/form'
import { validateSignUpSession } from '@/lib/functions/auth'
import { userDataMutationOptions } from '@/queries/auth-queries'
import { primaryCareSpecialistQueryOptions } from '@/queries/specialist-queries'
import { UserDataForm, formOpts } from '@/routes/auth/-components/user-data-form'

export const Route = createFileRoute('/auth/sign-up/user-data')({
  component: RouteComponent,
  beforeLoad: async () => await validateSignUpSession({ data: 'user-data' }),
})

function RouteComponent() {
  const router = useRouter()

  const {
    data: specialists,
    isPending: specialistsIsPending,
    isError: specialistsIsError,
    error: specialistsFetchError,
  } = useSuspenseQuery(primaryCareSpecialistQueryOptions)

  const {
    mutateAsync,
    isError: isMutationError,
    error: mutationError,
  } = useMutation({
    ...userDataMutationOptions,
    onSuccess: async () => await router.navigate({ to: '/auth/sign-up/payment' }),
  })

  const form = useAppForm({
    ...formOpts,

    onSubmit: mutateAsync,
  })

  return (
    <div className="container grid min-h-screen min-w-screen place-items-center">
      <Card className="relative w-full max-w-md [view-transition-name:auth-card] md:min-w-5xl">
        <CardHeader>
          <CardTitle>Sign Up</CardTitle>
          <CardDescription>Create a New Account</CardDescription>
          <Separator className="mt-2" />
        </CardHeader>
        <CardContent>
          <Activity mode={specialistsIsError ? 'visible' : 'hidden'}>
            <Alert variant="destructive" className="my-5">
              <AlertTitle>Error!</AlertTitle>
              <AlertDescription>
                An error occurred: {specialistsFetchError?.message}
              </AlertDescription>
            </Alert>
          </Activity>
          <Activity mode={isMutationError ? 'visible' : 'hidden'}>
            <Alert variant="destructive" className="my-5">
              <AlertTitle>Error!</AlertTitle>
              <AlertDescription>An error occurred: {mutationError?.message}</AlertDescription>
            </Alert>
          </Activity>
          <UserDataForm
            form={form}
            specialists={specialists}
            isSpecialistLoading={specialistsIsPending}
          />
        </CardContent>
      </Card>
    </div>
  )
}
