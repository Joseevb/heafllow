import * as z from 'zod'

import { insertSpecialistDataSchema } from '@/db/types/specialists-data.zod'

function requiredString(message: string) {
  return z.string().trim().min(1, message)
}

const passwordChecks = [
  { test: /[A-Z]/, message: 'Password needs an uppercase letter' },
  { test: /[a-z]/, message: 'Password needs a lowercase letter' },
  { test: /[0-9]/, message: 'Password needs a number' },
  {
    test: /[!@#$%^&*()_\-+=[\]{};':"\\|,.<>/?~]/,
    message: 'Password needs a special character',
  },
]

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .superRefine((pwd, ctx) => {
    passwordChecks.forEach(({ test, message }) => {
      if (!test.test(pwd)) {
        ctx.addIssue({ code: 'custom', message, path: [] })
      }
    })
  })

export const adminAddSpecialistFormSchema = z
  .object({
    firstName: requiredString('First name cannot be empty'),
    lastName: requiredString('Last name cannot be empty'),
    email: z.email('It must be a valid email'),
    password: passwordSchema,
    confirmPassword: passwordSchema,
    licenseNumber: insertSpecialistDataSchema.shape.licenseNumber,
    specialty: insertSpecialistDataSchema.shape.specialty,
    consultationDurationMinutes: insertSpecialistDataSchema.shape.consultationDurationMinutes,
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: 'custom',
        message: 'Passwords don’t match',
        path: ['confirmPassword'],
      })
    }
  })

export type AdminAddSpecialistFormInput = z.input<typeof adminAddSpecialistFormSchema>
export type AdminAddSpecialistFormValues = z.infer<typeof adminAddSpecialistFormSchema>
