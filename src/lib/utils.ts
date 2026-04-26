import type { ClassValue } from 'clsx'

import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: Array<ClassValue>) {
  return twMerge(clsx(inputs))
}

export const keysOf = <T extends Record<string, unknown>>(obj: T) =>
  Object.keys(obj) as [keyof T & string, ...Array<keyof T & string>]
