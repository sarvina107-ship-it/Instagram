import { useQuery } from '@tanstack/react-query'
import { Clapperboard } from 'lucide-react'
import { resolveMediaUrl } from '@/shared/lib/mediaUrl'
import { postApi } from '../api/postApi'
import type { Post } from '../model/types'

type PostGridProps = {
  userId: string
  isOwnProfile?: boolean
  onPostClick: (postId: string) => void
  onCreateClick?: () => void
}

export const ProfilePostsSection = ({
  userId,
  isOwnProfile = false,
  onPostClick,
  onCreateClick,
}: PostGridProps) => {
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['posts', userId],
    queryFn: () => postApi.getUserPosts(userId),
    enabled: !!userId,
  })

  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#dbdbdb] border-t-[#262626]" />
      </div>
    )
  }

  if (!posts.length) {
    return <PostGridEmpty isOwnProfile={isOwnProfile} onCreateClick={onCreateClick} />
  }

  return (
    <div className="grid grid-cols-3 gap-1 md:gap-[3px]">
      {posts.map((post) => (
        <PostGridItem key={post._id} post={post} onClick={() => onPostClick(post._id)} />
      ))}
    </div>
  )
}

export const PostGrid = ({
  userId,
  onPostClick,
}: {
  userId: string
  onPostClick: (postId: string) => void
}) => {
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['posts', userId],
    queryFn: () => postApi.getUserPosts(userId),
    enabled: !!userId,
  })

  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#dbdbdb] border-t-[#262626]" />
      </div>
    )
  }

  if (!posts.length) return null

  return (
    <div className="grid grid-cols-3 gap-1 md:gap-[3px]">
      {posts.map((post) => (
        <PostGridItem key={post._id} post={post} onClick={() => onPostClick(post._id)} />
      ))}
    </div>
  )
}

function PostGridItem({ post, onClick }: { post: Post; onClick: () => void }) {
  const media = post.media[0]
  const mediaUrl = resolveMediaUrl(media?.url)
  const isVideo = media?.type === 'video'

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative aspect-square overflow-hidden bg-[#efefef]"
    >
      {isVideo ? (
        <video
          src={mediaUrl ?? ''}
          className="h-full w-full object-cover"
          muted
        />
      ) : (
        <img
          src={mediaUrl ?? ''}
          alt={post.caption || 'Публикация'}
          className="h-full w-full object-cover transition group-hover:brightness-90"
        />
      )}

      {isVideo && (
        <Clapperboard className="absolute right-2 top-2 h-4 w-4 text-white drop-shadow" />
      )}

      {post.media.length > 1 && (
        <div className="absolute right-2 top-2 h-2 w-2 rounded-full bg-white/90 shadow" />
      )}
    </button>
  )
}

export const PostGridEmpty = ({
  isOwnProfile,
  onCreateClick,
}: {
  isOwnProfile: boolean
  onCreateClick?: () => void
}) => {
  if (!isOwnProfile) {
    return (
      <div className="flex flex-col items-center px-4 pb-10 pt-24 text-center">
        <div className="mb-6 flex h-[62px] w-[62px] items-center justify-center rounded-full border border-black">
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor">
            <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="1.5" />
            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
            <path d="M21 15l-5-5L5 21" strokeWidth="1.5" />
          </svg>
        </div>
        <h2 className="mb-3 text-[28px] font-light text-black">Публикации</h2>
        <p className="max-w-[360px] text-[14px] text-[#737373]">
          У этого пользователя пока нет публикаций.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center px-4 pb-10 pt-24 text-center">
      <div className="mb-6 flex h-[62px] w-[62px] items-center justify-center rounded-full border border-black">
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor">
          <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="1.5" />
          <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
          <path d="M21 15l-5-5L5 21" strokeWidth="1.5" />
        </svg>
      </div>
      <h2 className="mb-3 text-[28px] font-light text-black">Поделиться фото</h2>
      <p className="mb-4 max-w-[350px] text-[14px] text-[#262626]">
        Фото, которыми вы делитесь, будут показываться в вашем профиле.
      </p>
      <button
        type="button"
        onClick={onCreateClick}
        className="text-[14px] font-semibold text-[#0095f6]"
      >
        Поделитесь своим первым фото
      </button>
    </div>
  )
}
