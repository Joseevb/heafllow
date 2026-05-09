import type { AnyUseQueryOptions } from '@tanstack/react-query'

import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Activity } from 'react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useAppForm } from '@/hooks/form'
import { getSpecialistByQuery } from '@/lib/specialists.functions'
import { UserDataForm, formOpts } from '@/routes/auth/-components/user-data-form'

export const Route = createFileRoute('/auth/sign-up/user-data')({
  component: RouteComponent,
})

const getPrimaryCareSpecialistQuery = {
  queryKey: ['specialists', 'primary care'],
  queryFn: async () => {
    return await getSpecialistByQuery({
      data: {
        field: 'specialty',
        value: 'primary care',
      },
    })
  },
} satisfies AnyUseQueryOptions

function RouteComponent() {
  const {
    data: specialists,
    isPending,
    isError,
    error,
  } = useSuspenseQuery(getPrimaryCareSpecialistQuery)

  const form = useAppForm({
    ...formOpts,

    onSubmit: async ({ value }) => {
      alert(JSON.stringify(value, null, 2))
    },
  })

  return (
    <div className="container grid min-h-screen min-w-screen place-items-center">
      <Card className="relative w-full max-w-md [view-transition-name:auth-card]">
        <CardHeader>
          <CardTitle>Sign Up</CardTitle>
          <CardDescription>Create a New Account</CardDescription>
          <Separator className="mt-2" />
        </CardHeader>
        <CardContent>
          <Activity mode={isError ? 'visible' : 'hidden'}>
            <Alert variant="destructive" className="my-5">
              <AlertTitle>Error!</AlertTitle>
              <AlertDescription>An error occurred: {error?.message}</AlertDescription>
            </Alert>
          </Activity>
          <UserDataForm form={form} specialists={specialists} isSpecialistLoading={isPending} />
        </CardContent>
      </Card>
    </div>
  )
}
