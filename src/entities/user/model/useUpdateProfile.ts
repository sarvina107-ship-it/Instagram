import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AUTH_ME_QUERY_KEY } from '@/features/auth'
import { userApi } from '../api/userApi'
import type { UpdateProfilePayload } from './updateProfile'

export const useUpdateProfile = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => userApi.updateProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_ME_QUERY_KEY })
    },
  })
}
