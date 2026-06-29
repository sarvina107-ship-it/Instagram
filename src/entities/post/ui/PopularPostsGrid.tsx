import { useEffect, useRef } from 'react'
import { Clapperboard } from 'lucide-react'
import { resolveMediaUrl } from '@/shared/lib/mediaUrl'
import type { Post } from '../model/types'

type PopularPostsGridProps = {
  posts: Post[]
  isLoading?: boolean
  isFetchingNextPage?: boolean
  hasMore?: boolean
  onFetchMore?: () => void
  onPostClick: (postId: string, index: number) => void
}

export const PopularPostsGrid = ({
  posts,
  isLoading = false,
  isFetchingNextPage = false,
  hasMore = false,
  onFetchMore,
  onPostClick,
}: PopularPostsGridProps) => {
  const loadMoreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = loadMoreRef.current
    if (!element || !hasMore || !onFetchMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) {
          onFetchMore()
        }
      },
      { rootMargin: '200px' }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [onFetchMore, hasMore, isFetchingNextPage])

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#dbdbdb] border-t-[#262626]" />
      </div>
    )
  }

  if (!posts.length) {
    return (
      <p className="py-16 text-center text-[14px] text-[#8e8e8e]">
        Популярных публикаций пока нет.
      </p>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-[3px] sm:grid-cols-3 lg:grid-cols-4">
        {posts.map((post, index) => (
          <PopularPostTile
            key={post._id}
            post={post}
            onClick={() => onPostClick(post._id, index)}
          />
        ))}
      </div>

      {hasMore && (
        <div ref={loadMoreRef} className="flex justify-center py-8">
          {isFetchingNextPage && (
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#dbdbdb] border-t-[#262626]" />
          )}
        </div>
      )}
    </>
  )
}

function PopularPostTile({ post, onClick }: { post: Post; onClick: () => void }) {
  const media = post.media[0]
  const mediaUrl = resolveMediaUrl(media?.url)
  const isVideo = media?.type === 'video'
  const likesCount = post.likesCount ?? post.likes?.length ?? 0

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative aspect-square overflow-hidden bg-[#efefef]"
    >
      {isVideo ? (
        <video src={mediaUrl ?? ''} className="h-full w-full object-cover" muted />
      ) : (
        <img
          src={mediaUrl ?? ''}
          alt={post.caption || 'Публикация'}
          className="h-full w-full object-cover transition group-hover:brightness-75"
        />
      )}

      {isVideo && (
        <Clapperboard
          className="absolute right-2 top-2 h-4 w-4 text-white drop-shadow"
          strokeWidth={1.5}
        />
      )}

      <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/25 group-hover:opacity-100">
        <span className="text-[14px] font-semibold text-white">
          ♥ {likesCount.toLocaleString('ru-RU')}
        </span>
      </div>
    </button>
  )
}
