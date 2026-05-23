import { mutationOptions, queryOptions } from '@tanstack/react-query'
import { Result } from 'better-result'

import type { AdminAddSpecialistFormValues } from '@/schemas/admin-add-specialist'
import type { UpdateUserData } from '@/types/auth'

import {
  createSpecialistUser,
  listAdminUsers,
  softDeleteUserById,
  updateUserById,
  validateAdminUserDeletion,
  validateAdminUserRoleTransition,
} from '@/lib/admin.functions'

function unwrapServerResult<T>(
  result:
    | Awaited<ReturnType<typeof updateUserById>>
    | Awaited<ReturnType<typeof softDeleteUserById>>
    | Awaited<ReturnType<typeof createSpecialistUser>>,
) {
  const parsedResult = Result.deserialize(result)

  return parsedResult.match({
    ok: (value) => value as T,
    err: (error) => {
      throw new Error(
        typeof error === 'object' &&
          error &&
          'message' in error &&
          typeof error.message === 'string'
          ? error.message
          : 'Request failed',
      )
    },
  })
}

export const adminUsersQueryOptions = () =>
  queryOptions({
    queryKey: ['admin', 'users'],
    queryFn: listAdminUsers,
  })

export const updateAdminUserMutationOptions = () =>
  mutationOptions({
    mutationKey: ['admin', 'users', 'update'],
    mutationFn: async (input: { userId: string; data: UpdateUserData }) =>
      unwrapServerResult(await updateUserById({ data: input })),
  })

export const deleteAdminUserMutationOptions = () =>
  mutationOptions({
    mutationKey: ['admin', 'users', 'delete'],
    mutationFn: async (userId: string) =>
      unwrapServerResult<void>(await softDeleteUserById({ data: userId })),
  })

export const validateAdminUserDeletionMutationOptions = () =>
  mutationOptions({
    mutationKey: ['admin', 'users', 'validate-delete'],
    mutationFn: async (userId: string) => await validateAdminUserDeletion({ data: userId }),
  })

export const validateAdminUserRoleTransitionMutationOptions = () =>
  mutationOptions({
    mutationKey: ['admin', 'users', 'validate-role-transition'],
    mutationFn: async (input: { userId: string; role: 'admin' | 'client' | 'specialist' }) =>
      await validateAdminUserRoleTransition({ data: input }),
  })

export const createAdminSpecialistMutationOptions = () =>
  mutationOptions({
    mutationKey: ['admin', 'specialists', 'create'],
    mutationFn: async (input: AdminAddSpecialistFormValues) =>
      unwrapServerResult(await createSpecialistUser({ data: input })),
  })
