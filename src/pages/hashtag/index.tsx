import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MoreHorizontal } from 'lucide-react'
import { useMe } from '@/features/auth'
import { AppLayout } from '@/widgets/app-layout/ui/AppLayout'
import {
  PostDetailModal,
  PopularPostsGrid,
  postApi,
  enrichPosts,
} from '@/entities/post'
import {
  formatPostsCount,
  getPostsCountLabel,
} from '@/entities/post/lib/hashtagUtils'

export default function HashtagPage() {
  const { tag = '' } = useParams()
  const { data: currentUser } = useMe()
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)

  const normalizedTag = decodeURIComponent(tag).toLowerCase()

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['hashtag', normalizedTag],
    queryFn: () => postApi.getByHashtag(normalizedTag),
    enabled: !!normalizedTag,
  })

  const enrichedPosts = useMemo(
    () => enrichPosts(posts, currentUser),
    [posts, currentUser]
  )

  const activePost =
    viewerIndex !== null ? enrichedPosts[viewerIndex] : undefined

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-[935px] px-4 py-6 pb-24">
        <header className="mb-6 flex items-center justify-between border-b border-[#dbdbdb] pb-4">
          <div>
            <h1 className="text-[24px] font-bold text-black">#{normalizedTag}</h1>
            {!isLoading && (
              <p className="mt-1 text-[14px] text-[#8e8e8e]">
                {formatPostsCount(enrichedPosts.length)}{' '}
                {getPostsCountLabel(enrichedPosts.length)}
              </p>
            )}
          </div>
          <button type="button" className="text-[#262626]" aria-label="Ещё">
            <MoreHorizontal className="h-6 w-6" />
          </button>
        </header>

        <PopularPostsGrid
          posts={enrichedPosts}
          isLoading={isLoading}
          onPostClick={(_postId, index) => setViewerIndex(index)}
        />

        {!isLoading && enrichedPosts.length === 0 && (
          <p className="py-16 text-center text-[14px] text-[#8e8e8e]">
            Публикаций с этим хэштегом пока нет.
          </p>
        )}
      </div>

      {activePost && viewerIndex !== null && (
        <PostDetailModal
          postId={activePost._id}
          onClose={() => setViewerIndex(null)}
          navigation={{
            currentIndex: viewerIndex,
            totalCount: enrichedPosts.length,
            onPrev: () => setViewerIndex((index) => Math.max(0, (index ?? 0) - 1)),
            onNext: () =>
              setViewerIndex((index) =>
                Math.min(enrichedPosts.length - 1, (index ?? 0) + 1)
              ),
          }}
        />
      )}
    </AppLayout>
  )
}
