import { useState } from 'react'
import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Send,
  Smile,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useMe } from '@/features/auth'
import { UserAvatar } from '@/entities/user'
import { getUserId } from '@/entities/user/lib/follow'
import { buildPath } from '@/shared/config/routes'
import { resolveMediaUrl } from '@/shared/lib/mediaUrl'
import { postApi } from '../api/postApi'
import { enrichComments } from '../lib/commentUtils'
import { formatRelativeTime } from '../lib/formatTime'
import { usePostModal } from '../model/PostModalContext'
import { PostOptionsModal } from './PostOptionsModal'
import type { FeedResponse, Post } from '../model/types'

type FeedPostCardProps = {
  post: Post
  isRecommended?: boolean
}

const updatePostInFeedCache = (
  queryClient: ReturnType<typeof useQueryClient>,
  postId: string,
  updater: (post: Post) => Post
) => {
  queryClient.setQueriesData<InfiniteData<FeedResponse>>(
    { queryKey: ['feed'] },
    (data) => {
      if (!data) return data
      return {
        ...data,
        pages: data.pages.map((page) => ({
          ...page,
          posts: page.posts.map((post) =>
            post._id === postId ? updater(post) : post
          ),
        })),
      }
    }
  )

  queryClient.setQueriesData<Post[]>(
    { queryKey: ['feed', 'recommended'] },
    (posts) => posts?.map((post) => (post._id === postId ? updater(post) : post))
  )
}

export const FeedPostCard = ({ post, isRecommended = false }: FeedPostCardProps) => {
  const navigate = useNavigate()
  const { data: currentUser } = useMe()
  const { openPostDetail } = usePostModal()
  const queryClient = useQueryClient()

  const [activeMedia, setActiveMedia] = useState(0)
  const [commentText, setCommentText] = useState('')
  const [showAllCaption, setShowAllCaption] = useState(false)
  const [showOptions, setShowOptions] = useState(false)

  const isOwner = currentUser?._id === post.author._id
  const commentsEnabled = post.commentsEnabled !== false

  const comments = enrichComments(post.comments, currentUser)
  const likesCount = post.likesCount ?? 0
  const commentsCount = post.commentsCount ?? comments.length
  const media = post.media[activeMedia] ?? post.media[0]
  const mediaUrl = resolveMediaUrl(media?.url)
  const captionPreview =
    post.caption && post.caption.length > 120 && !showAllCaption
      ? `${post.caption.slice(0, 120)}...`
      : post.caption

  const goToProfile = () => navigate(buildPath.profile(post.author.username))

  const likeMutation = useMutation({
    mutationFn: () => postApi.toggleLike(post._id),
    onMutate: async () => {
      const nextLiked = !post.isLiked
      const updater = (current: Post) => {
        const currentLikes = current.likes ?? []
        const nextLikes = nextLiked
          ? [...currentLikes, currentUser?._id ?? '']
          : currentLikes.filter((like) => getUserId(like) !== currentUser?._id)

        return {
          ...current,
          isLiked: nextLiked,
          likes: nextLikes.filter(Boolean),
          likesCount: Math.max(0, (current.likesCount ?? 0) + (nextLiked ? 1 : -1)),
        }
      }
      updatePostInFeedCache(queryClient, post._id, updater)
      return { previousLiked: post.isLiked }
    },
    onError: () => {
      updatePostInFeedCache(queryClient, post._id, (current) => ({
        ...current,
        isLiked: post.isLiked,
        likesCount: post.likesCount,
        likes: post.likes,
      }))
    },
    onSuccess: (data) => {
      updatePostInFeedCache(queryClient, post._id, (current) => {
        const currentLikes = current.likes ?? []
        const nextLikes = data.isLiked
          ? [...currentLikes, currentUser?._id ?? '']
          : currentLikes.filter((like) => getUserId(like) !== currentUser?._id)

        return {
          ...current,
          isLiked: data.isLiked,
          likes: nextLikes.filter(Boolean),
          likesCount: data.likesCount,
        }
      })
    },
  })

  const saveMutation = useMutation({
    mutationFn: () => postApi.toggleSave(post._id),
    onSuccess: (data) => {
      updatePostInFeedCache(queryClient, post._id, (current) => ({
        ...current,
        isSaved: data.isSaved,
      }))
    },
  })

  const commentMutation = useMutation({
    mutationFn: (text: string) => postApi.addComment(post._id, text),
    onSuccess: (newComment) => {
      setCommentText('')
      const enriched = enrichComments([newComment], currentUser)[0]
      updatePostInFeedCache(queryClient, post._id, (current) => ({
        ...current,
        comments: [enriched, ...(current.comments ?? [])],
        commentsCount: (current.commentsCount ?? 0) + 1,
      }))
    },
  })

  const handleSubmitComment = () => {
    const text = commentText.trim()
    if (!text || commentMutation.isPending || !commentsEnabled) return
    commentMutation.mutate(text)
  }

  const showPrevMedia = () => {
    setActiveMedia((index) => Math.max(0, index - 1))
  }

  const showNextMedia = () => {
    setActiveMedia((index) => Math.min(post.media.length - 1, index + 1))
  }

  return (
    <article className="mb-4 border border-[#dbdbdb] bg-white">
      <header className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          onClick={goToProfile}
          className="flex min-w-0 items-center gap-3 text-left"
        >
          <UserAvatar
            src={post.author.avatar}
            username={post.author.username}
            size={32}
          />
          <div className="flex min-w-0 items-center gap-1 text-[14px]">
            <span className="truncate font-semibold text-black">
              {post.author.username}
            </span>
            {isRecommended && (
              <>
                <span className="text-[#8e8e8e]">•</span>
                <span className="text-[12px] text-[#8e8e8e]">Рекомендации</span>
              </>
            )}
            <span className="text-[#8e8e8e]">•</span>
            <span className="text-[#8e8e8e]">
              {formatRelativeTime(post.createdAt)}
            </span>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setShowOptions(true)}
          aria-label="Ещё"
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </header>

      <div className="relative aspect-square w-full bg-black">
        {media?.type === 'video' ? (
          <video
            src={mediaUrl ?? ''}
            controls
            className="h-full w-full object-contain"
          />
        ) : (
          <img
            src={mediaUrl ?? ''}
            alt={post.caption || 'Публикация'}
            className="h-full w-full object-cover"
          />
        )}

        {post.media.length > 1 && (
          <>
            {activeMedia > 0 && (
              <button
                type="button"
                onClick={showPrevMedia}
                className="absolute left-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow"
                aria-label="Предыдущее фото"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            {activeMedia < post.media.length - 1 && (
              <button
                type="button"
                onClick={showNextMedia}
                className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow"
                aria-label="Следующее фото"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1">
              {post.media.map((item, index) => (
                <span
                  key={item._id ?? item.url}
                  className={`h-1.5 w-1.5 rounded-full ${
                    index === activeMedia ? 'bg-[#0095f6]' : 'bg-white/60'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="px-4 py-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => likeMutation.mutate()}
              disabled={likeMutation.isPending}
              aria-label={post.isLiked ? 'Убрать лайк' : 'Нравится'}
            >
              <Heart
                className={`h-6 w-6 ${
                  post.isLiked ? 'fill-[#ed4956] text-[#ed4956]' : 'text-black'
                }`}
                strokeWidth={1.5}
              />
            </button>
            <button
              type="button"
              onClick={() => openPostDetail(post._id)}
              aria-label="Комментарии"
            >
              <MessageCircle className="h-6 w-6" strokeWidth={1.5} />
            </button>
            <button type="button" aria-label="Поделиться">
              <Send className="h-6 w-6" strokeWidth={1.5} />
            </button>
          </div>
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            aria-label={post.isSaved ? 'Убрать из сохранённого' : 'Сохранить'}
          >
            <Bookmark
              className={`h-6 w-6 ${
                post.isSaved ? 'fill-black text-black' : 'text-black'
              }`}
              strokeWidth={1.5}
            />
          </button>
        </div>

        {likesCount > 0 && (
          <p className="mb-2 text-[14px] font-semibold text-black">
            {likesCount.toLocaleString('ru-RU')}{' '}
            {likesCount === 1 ? 'отметка' : 'отметок'} «Нравится»
          </p>
        )}

        {post.caption && (
          <p className="mb-2 text-[14px] text-black">
            <button
              type="button"
              onClick={goToProfile}
              className="mr-2 font-semibold"
            >
              {post.author.username}
            </button>
            {captionPreview}
            {post.caption.length > 120 && !showAllCaption && (
              <button
                type="button"
                onClick={() => setShowAllCaption(true)}
                className="ml-1 text-[#8e8e8e]"
              >
                ещё
              </button>
            )}
          </p>
        )}

        {commentsCount > 0 && (
          <button
            type="button"
            onClick={() => openPostDetail(post._id)}
            className="mb-2 text-[14px] text-[#8e8e8e]"
          >
            Посмотреть все комментарии ({commentsCount})
          </button>
        )}

        {comments.slice(0, 2).map((comment) => (
          <p key={comment._id} className="mb-1 text-[14px] text-black">
            <button
              type="button"
              onClick={() => navigate(buildPath.profile(comment.author.username))}
              className="mr-2 font-semibold"
            >
              {comment.author.username}
            </button>
            {comment.text}
          </p>
        ))}

        <div className="mt-3 flex items-center gap-3 border-t border-[#efefef] pt-3">
          {commentsEnabled ? (
            <>
              <Smile className="h-5 w-5 shrink-0 text-[#8e8e8e]" />
              <input
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') handleSubmitComment()
                }}
                placeholder="Добавьте комментарий..."
                className="min-w-0 flex-1 text-[14px] outline-none placeholder:text-[#8e8e8e]"
              />
              {commentText.trim() && (
                <button
                  type="button"
                  onClick={handleSubmitComment}
                  disabled={commentMutation.isPending}
                  className="text-[14px] font-semibold text-[#0095f6] disabled:opacity-50"
                >
                  Опубликовать
                </button>
              )}
            </>
          ) : (
            <p className="w-full text-center text-[14px] text-[#8e8e8e]">
              Комментарии отключены.
            </p>
          )}
        </div>
      </div>

      {showOptions && (
        <PostOptionsModal
          post={post}
          isOwner={isOwner}
          onClose={() => setShowOptions(false)}
        />
      )}
    </article>
  )
}
