import { createEnv } from '@t3-oss/env-core'
import * as z from 'zod'

const skipValidation =
  import.meta.env.VITE_SKIP_ENV_VALIDATION === 'true' ||
  (typeof process !== 'undefined' &&
    process.env.SKIP_ENV_VALIDATION === 'true')

export const env = createEnv({
  skipValidation,
  clientPrefix: 'VITE_',
  client: {
    VITE_APP_TITLE: z.string().min(1).optional(),
    VITE_R2_PUBLIC_BASE_URL: z.url().nonempty().optional(),
  },
  runtimeEnv: import.meta.env,
  emptyStringAsUndefined: true,
})
