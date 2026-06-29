import { useMemo } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useMe } from '@/features/auth'
import { postApi } from '../api/postApi'
import { enrichPosts } from '../lib/enrichPost'

const PAGE_SIZE = 24

export const usePopularPosts = () => {
  const { data: currentUser } = useMe()

  const query = useInfiniteQuery({
    queryKey: ['explore'],
    queryFn: async ({ pageParam }) => {
      const posts = await postApi.getExplore(pageParam, PAGE_SIZE)
      return enrichPosts(posts, currentUser).sort(
        (a, b) => (b.likesCount ?? 0) - (a.likesCount ?? 0)
      )
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.length === PAGE_SIZE ? lastPageParam + 1 : undefined,
  })

  const posts = useMemo(
    () => query.data?.pages.flat() ?? [],
    [query.data]
  )

  return {
    posts,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasMore: query.hasNextPage ?? false,
    fetchMore: query.fetchNextPage,
  }
}
