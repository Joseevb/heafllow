import { formOptions } from '@tanstack/react-form'

import type { UserData } from '@/schemas/auth'

import { FieldDescription, FieldGroup, FieldLegend, FieldSet } from '@/components/ui/field'
import { Skeleton } from '@/components/ui/skeleton'
import { withForm } from '@/hooks/form'

export const formOpts = formOptions({
  defaultValues: {
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
    },
    birthDate: new Date(),
    phoneNumber: '',
    primaryCareSpecialist: '',
  } satisfies UserData,
})

export const UserDataForm = withForm({
  ...formOpts,
  props: {
    specialists: [] as Array<{ name: string; id: string }>,
    isSpecialistLoading: false,
  },
  render: ({ form, specialists, isSpecialistLoading }) => (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
    >
      <FieldGroup>
        <FieldSet>
          <FieldLegend>Personal Information</FieldLegend>
          <FieldDescription>
            Complete your personal information as well as your primary care specialist
          </FieldDescription>
          <FieldGroup>
            <form.AppField name="birthDate">
              {(field) => (
                <field.TextField
                  type="date"
                  label="Birth date"
                  description="Enter your birth date"
                  placeholder="1970/01/01"
                  required
                />
              )}
            </form.AppField>

            <form.AppField name="phoneNumber">
              {(field) => (
                <field.TextField
                  type="number"
                  label="Phone Number"
                  description="Enter your phone number"
                  placeholder="00000000000"
                  required
                />
              )}
            </form.AppField>

            <form.AppField name="primaryCareSpecialist">
              {(field) =>
                isSpecialistLoading ? (
                  <Skeleton />
                ) : (
                  <field.Select
                    label="Primary Care specialist"
                    description="Select your primary care specialist"
                    options={specialists.map((s) => ({ value: s.id, label: s.name }))}
                    required
                  />
                )
              }
            </form.AppField>
          </FieldGroup>
        </FieldSet>
      </FieldGroup>
    </form>
  ),
})
