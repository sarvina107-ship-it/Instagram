import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AUTH_ME_QUERY_KEY } from '@/features/auth'
import type { AuthUser } from '@/features/auth/model/types'
import { userApi } from '../api/userApi'
import {
  isUserFollowed,
  toggleFollowersList,
  toggleFollowingList,
} from '../lib/follow'
import type { User } from './types'

export const useFollowUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => userApi.follow(userId),
    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: AUTH_ME_QUERY_KEY })
      await queryClient.cancelQueries({ queryKey: ['user'] })

      const previousMe = queryClient.getQueryData<AuthUser>(AUTH_ME_QUERY_KEY)
      const wasFollowing = isUserFollowed(previousMe, userId)
      const nextFollowing = !wasFollowing

      if (previousMe) {
        queryClient.setQueryData<AuthUser>(AUTH_ME_QUERY_KEY, {
          ...previousMe,
          following: toggleFollowingList(
            previousMe.following,
            userId,
            nextFollowing
          ),
        })
      }

      const previousProfiles = queryClient
        .getQueriesData<User>({ queryKey: ['user'] })
        .map(([queryKey, data]) => [queryKey, data] as const)

      if (previousMe) {
        queryClient.setQueriesData<User>({ queryKey: ['user'] }, (profile) => {
          if (!profile || profile._id !== userId) return profile

          return {
            ...profile,
            isFollowing: nextFollowing,
            followers: toggleFollowersList(
              profile.followers,
              previousMe._id,
              nextFollowing
            ),
          }
        })
      }

      return { previousMe, previousProfiles }
    },
    onError: (_error, _userId, context) => {
      if (context?.previousMe) {
        queryClient.setQueryData(AUTH_ME_QUERY_KEY, context.previousMe)
      }

      context?.previousProfiles.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data)
      })
    },
    onSuccess: (data, userId) => {
      const nowFollowing = data.following

      queryClient.setQueryData<AuthUser>(AUTH_ME_QUERY_KEY, (currentUser) => {
        if (!currentUser) return currentUser

        return {
          ...currentUser,
          following: toggleFollowingList(
            currentUser.following,
            userId,
            nowFollowing
          ),
        }
      })

      queryClient.setQueriesData<User>({ queryKey: ['user'] }, (profile) => {
        if (!profile || profile._id !== userId) return profile

        const currentUser = queryClient.getQueryData<AuthUser>(AUTH_ME_QUERY_KEY)

        return {
          ...profile,
          isFollowing: nowFollowing,
          followers: currentUser
            ? toggleFollowersList(
                profile.followers,
                currentUser._id,
                nowFollowing
              )
            : profile.followers,
        }
      })

      queryClient.invalidateQueries({ queryKey: ['suggestions'] })
      queryClient.invalidateQueries({ queryKey: ['followers'] })
      queryClient.invalidateQueries({ queryKey: ['following'] })
    },
  })
}
