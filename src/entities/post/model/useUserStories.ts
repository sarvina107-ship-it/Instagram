import { useQuery } from '@tanstack/react-query'
import { storyApi } from '../api/storyApi'

export const useUserStories = (
  userId?: string,
  enabled = true,
  refetchInterval?: number
) => {
  return useQuery({
    queryKey: ['stories', 'user', userId],
    queryFn: () => storyApi.getUserStories(userId!),
    enabled: !!userId && enabled,
    refetchInterval,
  })
}

