import * as z from 'zod'

import { signUpState } from '@/types/auth'

function requiredString(message: string) {
  return z.string().trim().min(1, message)
}

const birthDateInputSchema = requiredString('Date of birth cannot be empty')
  .pipe(z.coerce.date())
  .refine((date) => date <= new Date(), 'Date of birth cannot be in the future')

export const addressSchema = z.object({
  street: requiredString('Street cannot be empty'),
  city: requiredString('City cannot be empty'),
  state: requiredString('State cannot be empty'),
  country: requiredString('Country cannot be empty'),
  zipCode: requiredString('Zip code cannot be empty'),
})

export const userDataSchema = z.object({
  phoneNumber: requiredString('Phone number cannot be empty'),
  birthDate: birthDateInputSchema,
  address: addressSchema,
  primaryCareSpecialist: requiredString('Primary care specialist is required'),
})

export const parsedUserDataSchema = z.object({
  phoneNumber: requiredString('Phone number cannot be empty'),
  birthDate: z.date().refine((date) => date <= new Date(), 'Date of birth cannot be in the future'),
  address: addressSchema,
  primaryCareSpecialist: requiredString('Primary care specialist is required'),
})

export type UserData = z.infer<typeof parsedUserDataSchema>
export type UserDataInput = z.input<typeof userDataSchema>
export type Address = z.infer<typeof addressSchema>

export const signInSchema = z.object({
  email: z.email('Invalid email'),
  password: requiredString('Password is required'),
  rememberMe: z.boolean(),
})

export type SignIn = z.infer<typeof signInSchema>

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

export const signUpBaseSchema = z.object({
  firstName: requiredString('First name cannot be empty'),
  lastName: requiredString('Last name cannot be empty'),
  email: z.email('It must be a valid email'),
  password: passwordSchema,
  confirmPassword: passwordSchema,
  image: z.string('It must be a valid image').optional(),
})

export const signUpSchema = signUpBaseSchema.superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: 'custom',
      message: 'Passwords don’t match',
      path: ['confirmPassword'],
    })
  }
})

export type SignUp = z.infer<typeof signUpSchema>

export const socialSignUpAccountSchema = z.object({
  id: requiredString('Social account id is required'),
  email: z.email('Invalid email'),
  name: requiredString('Name is required'),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
})

const signUpBaseSchemaLenient = signUpBaseSchema.extend({
  firstName: z.string().optional().nullable().default(''),
  lastName: z.string().optional().nullable().default(''),
})

export const signUpSessionAccountDataSchema = signUpBaseSchemaLenient.partial({
  password: true,
  confirmPassword: true,
})

export const serializableUserDataSchema = z.object({
  phoneNumber: requiredString('Phone number cannot be empty'),
  birthDate: requiredString('Date of birth cannot be empty'),
  address: addressSchema,
  primaryCareSpecialist: requiredString('Primary care specialist is required'),
})

export const serializableSignUpSession = z.object({
  accountData: signUpSessionAccountDataSchema.optional(),
  userData: serializableUserDataSchema.optional(),
  state: z.enum(signUpState).optional(),
})

export const signUpUserInputSchema = z.discriminatedUnion('step', [
  z.object({
    step: z.literal('account'),
    accountData: signUpSchema,
  }),
  z.object({
    step: z.literal('social'),
    accountData: socialSignUpAccountSchema,
  }),
  z.object({
    step: z.literal('user-data'),
    userData: userDataSchema,
  }),
])

export const finalizeOnboardingInputSchema = z
  .object({
    requireActiveSubscription: z.boolean().optional(),
  })
  .optional()

export type SerializableSignUpSession = z.infer<typeof serializableSignUpSession>
