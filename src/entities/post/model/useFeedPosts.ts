import { useMemo } from 'react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useMe } from '@/features/auth'
import { getUserId } from '@/entities/user/lib/follow'
import { userApi } from '@/entities/user/api/userApi'
import { postApi } from '../api/postApi'
import { enrichPosts } from '../lib/enrichPost'
import type { Post } from '../model/types'

export const useFeedPosts = () => {
  const { data: currentUser } = useMe()

  const feedQuery = useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: ({ pageParam }) => postApi.getFeed(pageParam, 10),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
  })

  const followingPosts = useMemo(() => {
    const posts =
      feedQuery.data?.pages.flatMap((page) => page.posts) ?? []
    return enrichPosts(posts, currentUser)
  }, [feedQuery.data, currentUser])

  const followingPostIds = useMemo(
    () => new Set(followingPosts.map((post) => post._id)),
    [followingPosts]
  )

  const followingUserIds = useMemo(() => {
    const ids = new Set<string>()
    if (currentUser?._id) ids.add(currentUser._id)
    currentUser?.following?.forEach((user) => ids.add(getUserId(user)))
    return ids
  }, [currentUser])

  const { data: suggestions = [] } = useQuery({
    queryKey: ['suggestions'],
    queryFn: () => userApi.getSuggestions(),
  })

  const recommendedQuery = useQuery({
    queryKey: [
      'feed',
      'recommended',
      suggestions.map((user) => user._id).join(','),
      followingPostIds.size,
    ],
    queryFn: async (): Promise<Post[]> => {
      if (!currentUser || !suggestions.length) return []

      const batches = await Promise.all(
        suggestions.slice(0, 8).map((user) =>
          postApi.getUserPosts(user._id).catch(() => [] as Post[])
        )
      )

      return enrichPosts(
        batches
          .flat()
          .filter((post) => !followingPostIds.has(post._id))
          .filter((post) => !followingUserIds.has(post.author._id))
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ),
        currentUser
      )
    },
    enabled: !!currentUser && suggestions.length > 0 && !feedQuery.isLoading,
  })

  const posts = useMemo(
    () => [...followingPosts, ...(recommendedQuery.data ?? [])],
    [followingPosts, recommendedQuery.data]
  )

  return {
    posts,
    followingPosts,
    recommendedPosts: recommendedQuery.data ?? [],
    feedQuery,
    isLoading: feedQuery.isLoading,
    isFetchingNextPage: feedQuery.isFetchingNextPage,
    hasMoreFollowing: feedQuery.hasNextPage ?? false,
    fetchMoreFollowing: feedQuery.fetchNextPage,
  }
}
