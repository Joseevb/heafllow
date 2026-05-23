import { formOptions } from '@tanstack/react-form'

import type { AdminAddSpecialistFormInput } from '@/schemas/admin-add-specialist'

import { FieldDescription, FieldGroup, FieldLegend, FieldSet } from '@/components/ui/field'
import { withForm } from '@/hooks/form'
import { adminAddSpecialistFormSchema } from '@/schemas/admin-add-specialist'
import { SPECIALTIES } from '@/types/specialties'

export const formOpts = formOptions({
  defaultValues: {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    licenseNumber: '',
    specialty: 'Primary Care' as (typeof SPECIALTIES)[number],
    consultationDurationMinutes: 30,
  } satisfies AdminAddSpecialistFormInput,
  validators: {
    onSubmit: adminAddSpecialistFormSchema,
  },
})

export const AddSpecialistForm = withForm({
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
        <FieldLegend>Account Details</FieldLegend>
        <FieldDescription>
          Create the Better Auth account and immediately assign the specialist role.
        </FieldDescription>
        <FieldGroup>
          <div className="grid gap-4 md:grid-cols-2">
            <form.AppField name="firstName">
              {(field) => (
                <field.TextField
                  label="First Name"
                  description="Used in the specialist account name"
                  placeholder="Jane"
                  required
                />
              )}
            </form.AppField>

            <form.AppField name="lastName">
              {(field) => (
                <field.TextField
                  label="Last Name"
                  description="Used in the specialist account name"
                  placeholder="Doe"
                  required
                />
              )}
            </form.AppField>
          </div>

          <form.AppField name="email">
            {(field) => (
              <field.TextField
                type="email"
                label="Email"
                description="Used for sign in and notifications"
                placeholder="jane.specialist@healflow.com"
                required
              />
            )}
          </form.AppField>

          <div className="grid gap-4 md:grid-cols-2">
            <form.AppField name="password">
              {(field) => (
                <field.TextField
                  type="password"
                  label="Password"
                  description="Must meet the standard account password requirements"
                  placeholder="Create a secure password"
                  required
                />
              )}
            </form.AppField>

            <form.AppField name="confirmPassword">
              {(field) => (
                <field.TextField
                  type="password"
                  label="Confirm Password"
                  description="Re-enter the password to confirm it"
                  placeholder="Repeat the password"
                  required
                />
              )}
            </form.AppField>
          </div>
        </FieldGroup>
      </FieldSet>

      <FieldSet className="rounded-2xl border border-border/60 bg-card/80 p-5">
        <FieldLegend>Specialist Profile</FieldLegend>
        <FieldDescription>
          These details power specialist lookup, specialist assignment, and appointment duration.
        </FieldDescription>
        <FieldGroup>
          <div className="grid gap-4 md:grid-cols-2">
            <form.AppField name="licenseNumber">
              {(field) => (
                <field.TextField
                  label="License Number"
                  description="Must be unique across specialist profiles"
                  placeholder="LIC-12345678"
                  required
                />
              )}
            </form.AppField>

            <form.AppField name="consultationDurationMinutes">
              {(field) => (
                <field.TextField
                  type="number"
                  label="Consultation Duration"
                  description="Appointment duration in minutes"
                  min={15}
                  step={15}
                  required
                  value={String(field.state.value)}
                  onChange={(event) => field.handleChange(Number(event.target.value))}
                />
              )}
            </form.AppField>
          </div>

          <form.AppField name="specialty">
            {(field) => (
              <field.Select
                label="Specialty"
                description="Used in specialist search and profile display"
                options={SPECIALTIES.map((specialty) => ({
                  label: specialty,
                  value: specialty,
                }))}
                required
              />
            )}
          </form.AppField>
        </FieldGroup>
      </FieldSet>

      <form.AppForm>
        <div className="flex justify-end">
          <form.SubscribeButton label="Create Specialist" />
        </div>
      </form.AppForm>
    </form>
  ),
})
