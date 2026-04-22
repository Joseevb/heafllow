import { useForm } from '@tanstack/react-form'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { createServerFn, useServerFn } from '@tanstack/react-start'
import * as z from 'zod'

import SocialSignOn from '@/components/social-sign-on'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  FieldGroup,
  Field,
  FieldLabel,
  FieldError,
  FieldDescription,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { db } from '@/db'
import { user } from '@/db/schemas'
import { authClient } from '@/lib/auth-client'

export const Route = createFileRoute('/')({ component: Home })

const schema = z.object({
  name: z.string(),
  email: z.email(),
  password: z.string(),
})

const getUsersServerFn = createServerFn().handler(
  async () => await db.select().from(user),
)

function Home() {
  const getUsers = useServerFn(getUsersServerFn)

  const { data } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  })

  const form = useForm({
    defaultValues: { name: '', email: '', password: '' } satisfies z.infer<
      typeof schema
    >,
    validators: {
      onSubmit: schema,
    },
    onSubmit: async ({ value }) => {
      await authClient.signUp.email(value)
    },
  })

  return (
    <Card className="p-8">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
        method="POST"
      >
        <FieldGroup>
          <form.Field name="name">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="John Doe"
                    autoComplete="off"
                  />
                  <FieldDescription>Your full name</FieldDescription>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          </form.Field>

          <form.Field name="email">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="john-doe@gmail.com"
                    autoComplete="off"
                  />
                  <FieldDescription>Your email</FieldDescription>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          </form.Field>

          <form.Field name="password">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="********************"
                    autoComplete="off"
                  />
                  <FieldDescription>A secure password</FieldDescription>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          </form.Field>
        </FieldGroup>
        <Button type="submit">Submit</Button>
      </form>
      <SocialSignOn />

      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </Card>
  )
}
