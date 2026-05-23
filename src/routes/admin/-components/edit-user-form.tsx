import { formOptions } from '@tanstack/react-form'

import type { AdminUserEditInput } from '@/schemas/admin'

import { FieldDescription, FieldGroup, FieldLegend, FieldSet } from '@/components/ui/field'
import { withForm } from '@/hooks/form'
import { adminUserEditSchema } from '@/schemas/admin'

const defaultValues: AdminUserEditInput = {
  name: '',
  email: '',
  role: 'client',
  banned: 'false',
}

export const formOpts = formOptions({
  defaultValues,
  validators: {
    onSubmit: adminUserEditSchema,
  },
})

export const EditAdminUserForm = withForm({
  ...formOpts,
  render: ({ form }) => (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault()
        form.handleSubmit()
      }}
    >
      <FieldSet className="rounded-2xl border border-border/60 bg-card/80 p-5">
        <FieldLegend>User Access</FieldLegend>
        <FieldDescription>
          Update the core account fields managed by Better Auth. Role changes only work when the
          matching client or specialist profile data already exists.
        </FieldDescription>
        <FieldGroup>
          <form.AppField name="name">
            {(field) => (
              <field.TextField
                label="Full Name"
                description="Displayed across the application"
                placeholder="Jane Doe"
                required
              />
            )}
          </form.AppField>

          <form.AppField name="email">
            {(field) => (
              <field.TextField
                type="email"
                label="Email"
                description="Used for sign in and notifications"
                placeholder="jane@healflow.com"
                required
              />
            )}
          </form.AppField>

          <div className="grid gap-4 md:grid-cols-2">
            <form.AppField name="role">
              {(field) => (
                <field.Select
                  label="Role"
                  description="Determines dashboard access"
                  options={[
                    { label: 'Client', value: 'client' },
                    { label: 'Specialist', value: 'specialist' },
                    { label: 'Admin', value: 'admin' },
                  ]}
                  required
                />
              )}
            </form.AppField>

            <form.AppField name="banned">
              {(field) => (
                <field.Select
                  label="Access"
                  description="Toggle whether the user can sign in"
                  options={[
                    { label: 'Active', value: 'false' },
                    { label: 'Blocked', value: 'true' },
                  ]}
                  required
                />
              )}
            </form.AppField>
          </div>
        </FieldGroup>
      </FieldSet>

      <form.AppForm>
        <div className="flex justify-end">
          <form.SubscribeButton label="Save Changes" />
        </div>
      </form.AppForm>
    </form>
  ),
})
