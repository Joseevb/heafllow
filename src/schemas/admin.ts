import * as z from 'zod'

export const adminUserEditSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.email('Valid email is required'),
  role: z.enum(['admin', 'client', 'specialist']),
  banned: z.enum(['true', 'false']),
})

export type AdminUserEditInput = z.infer<typeof adminUserEditSchema>
