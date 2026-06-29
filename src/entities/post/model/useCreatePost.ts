import { useMutation, useQueryClient } from '@tanstack/react-query'
import { postApi } from '../api/postApi'
import type { CreatePostPayload } from '../model/types'

export const useCreatePost = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreatePostPayload) => postApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['user'] })
      queryClient.invalidateQueries({ queryKey: ['feed'] })
    },
  })
}
