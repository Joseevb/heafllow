import { describe, expect, test } from 'bun:test'

import { cn, keysOf } from '../../src/lib/utils'

describe('utils', () => {
  test('cn merges class names and resolves tailwind conflicts', () => {
    expect(cn('px-2', false, 'px-4', 'text-sm')).toBe('px-4 text-sm')
  })

  test('keysOf returns the object keys as a typed array', () => {
    const result = keysOf({ admin: 1, client: 2, specialist: 3 })

    expect(result).toEqual(['admin', 'client', 'specialist'])
  })
})
