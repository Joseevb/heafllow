import { formOptions } from '@tanstack/react-form'
import { Link } from '@tanstack/react-router'

import type { SignUp } from '@/schemas/auth'

import { Button } from '@/components/ui/button'
import { FieldGroup, FieldLegend, FieldSet } from '@/components/ui/field'
import { withForm } from '@/hooks/form'
import { signUpSchema } from '@/schemas/auth'

export const formOpts = formOptions({
  defaultValues: {} as SignUp,
  validators: {
    onSubmit: signUpSchema,
  },
})

export const SignUpForm = withForm({
  ...formOpts,
  render: ({ form }) => (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
    >
      <FieldGroup>
        <FieldSet>
          <FieldLegend>Name</FieldLegend>
          <div className="grid grid-cols-2 gap-4">
            <form.AppField name="firstName">
              {(field) => (
                <field.TextField
                  type="text"
                  label="First Name"
                  description="Enter your first name"
                  placeholder="John"
                  required
                />
              )}
            </form.AppField>

            <form.AppField name="lastName">
              {(field) => (
                <field.TextField
                  type="text"
                  label="Last Name"
                  description="Enter your last name"
                  placeholder="Doe"
                  required
                />
              )}
            </form.AppField>
          </div>
        </FieldSet>

        <FieldSet>
          <form.AppField name="email">
            {(field) => (
              <field.TextField
                type="email"
                label="Email"
                description="Enter your email"
                placeholder="john@doe.com"
                required
              />
            )}
          </form.AppField>
        </FieldSet>

        <FieldSet>
          <FieldLegend>Password</FieldLegend>
          <div className="grid grid-cols-2 gap-4">
            <form.AppField name="password">
              {(field) => (
                <field.TextField
                  type="password"
                  label="Password"
                  description="Enter your secure password"
                  placeholder="*********"
                />
              )}
            </form.AppField>

            <form.AppField name="confirmPassword">
              {(field) => (
                <field.TextField
                  type="password"
                  label="Confirm Password"
                  description="Enter your password again"
                  placeholder="*********"
                />
              )}
            </form.AppField>
          </div>
        </FieldSet>

        <FieldSet>
          <form.AppField name="image">
            {(field) => (
              <field.TextField
                type="url"
                label="Profile Image"
                description="Enter your profile image URL (optional)"
                placeholder="https://example.com/profile.jpg"
              />
            )}
          </form.AppField>
        </FieldSet>
      </FieldGroup>

      <form.AppForm>
        <div className="mt-3 flex flex-row items-end justify-end gap-5 ">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Already have an account?</span>
            <Button
              nativeButton={false}
              variant="secondary"
              render={<Link to="/auth">Sign In</Link>}
            />
          </div>
          <form.SubscribeButton label="Sign Up" />
        </div>
      </form.AppForm>
    </form>
  ),
})
