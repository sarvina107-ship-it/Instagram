import { useMutation, useQueryClient } from '@tanstack/react-query'
import { storyApi } from '../api/storyApi'
import type { CreateStoryPayload } from '../api/storyApi'

export const useCreateStory = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateStoryPayload) => storyApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] })
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
  })
}

