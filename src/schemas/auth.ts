import * as z from 'zod'

import { signUpState } from '@/types/auth'

export const addressSchema = z.object({
  street: z.string().nonempty('Street cannot be empty').nonoptional('Street cannot be empty'),
  city: z.string().nonempty('City cannot be empty').nonoptional('City cannot be empty'),
  state: z.string().nonempty('State cannot be empty').nonoptional('State cannot be empty'),
  zipCode: z.string().nonempty('Zip code cannot be empty').nonoptional('Zip code cannot be empty'),
})

export const userDataSchema = z.object({
  phoneNumber: z
    .string()
    .nonempty('Phone number cannot be empty')
    .nonoptional('Phone number cannot be empty'),
  birthDate: z
    .date()
    .nonoptional('Date of birth cannot be empty')
    .refine((date) => date <= new Date(), 'Date of birth cannot be in the future'),
  address: addressSchema,
  primaryCareSpecialist: z
    .uuid()
    .nonempty('Primary care specialist is required')
    .nonoptional('Primary care specialist is required'),
})

export type UserData = z.infer<typeof userDataSchema>
export type Address = z.infer<typeof addressSchema>

export const signInSchema = z.object({
  email: z.email('Invalid email').nonempty('Email is required').nonoptional('Email is required'),
  password: z.string().nonempty('Password is required').nonoptional('Password is required'),
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
  firstName: z.string().nonempty('First name cannot be empty'),
  lastName: z.string().nonempty('Last name cannot be empty'),
  email: z.email('It must be a valid email').nonempty('Email cannot be empty'),
  password: passwordSchema,
  confirmPassword: passwordSchema,
  profileImage: z.file('It must be a valid image').optional(),
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

const signUpBaseSchemaLenient = signUpBaseSchema.extend({
  firstName: z.string().optional().nullable().default(''),
  lastName: z.string().optional().nullable().default(''),
})

export const serializableSignUpSession = z.object({
  accountData: signUpBaseSchemaLenient
    .omit({ profileImage: true })
    .partial({ password: true, confirmPassword: true })
    .extend({
      profileImageRef: z.string().optional(),
    })
    .optional(),
  userData: userDataSchema.optional(),
  state: z.enum(signUpState).optional(),
})

export type SerializableSignUpSession = z.infer<typeof serializableSignUpSession>
