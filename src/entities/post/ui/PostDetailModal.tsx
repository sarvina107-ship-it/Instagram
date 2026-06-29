import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Send,
  Smile,
  X,
} from 'lucide-react'
import { useMe } from '@/features/auth'
import { UserAvatar } from '@/entities/user'
import { buildPath } from '@/shared/config/routes'
import { resolveMediaUrl } from '@/shared/lib/mediaUrl'
import { postApi } from '../api/postApi'
import { enrichComments } from '../lib/commentUtils'
import { formatRelativeTime, formatRelativeTimeLong } from '../lib/formatTime'
import { PostOptionsModal } from './PostOptionsModal'
import type { Post, PostComment } from '../model/types'

type PostDetailNavigation = {
  currentIndex: number
  totalCount: number
  onPrev: () => void
  onNext: () => void
}

type PostDetailModalProps = {
  postId: string
  onClose: () => void
  navigation?: PostDetailNavigation
}

export const PostDetailModal = ({
  postId,
  onClose,
  navigation,
}: PostDetailModalProps) => {
  const navigate = useNavigate()
  const { data: currentUser } = useMe()
  const queryClient = useQueryClient()
  const [commentText, setCommentText] = useState('')
  const [activeMedia, setActiveMedia] = useState(0)
  const [showOptions, setShowOptions] = useState(false)

  useEffect(() => {
    setCommentText('')
    setActiveMedia(0)
  }, [postId])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (!navigation) return
      if (event.key === 'ArrowLeft' && navigation.currentIndex > 0) {
        navigation.onPrev()
      }
      if (
        event.key === 'ArrowRight' &&
        navigation.currentIndex < navigation.totalCount - 1
      ) {
        navigation.onNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigation, onClose])

  const { data: post, isLoading } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => postApi.getById(postId),
  })

  const comments = enrichComments(post?.comments, currentUser)

  const updatePostCache = (updater: (current: Post) => Post) => {
    queryClient.setQueryData<Post>(['post', postId], (current) =>
      current ? updater(current) : current
    )
  }

  const likeMutation = useMutation({
    mutationFn: () => postApi.toggleLike(postId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['post', postId] })
      const previous = queryClient.getQueryData<Post>(['post', postId])

      if (previous) {
        const nextLiked = !previous.isLiked
        updatePostCache((current) => ({
          ...current,
          isLiked: nextLiked,
          likesCount: Math.max(
            0,
            (current.likesCount ?? current.likes?.length ?? 0) + (nextLiked ? 1 : -1)
          ),
        }))
      }

      return { previous }
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['post', postId], context.previous)
      }
    },
    onSuccess: (data) => {
      updatePostCache((current) => ({
        ...current,
        isLiked: data.isLiked,
        likesCount: data.likesCount,
      }))
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['feed'] })
    },
  })

  const saveMutation = useMutation({
    mutationFn: () => postApi.toggleSave(postId),
    onSuccess: (data) => {
      updatePostCache((current) => ({ ...current, isSaved: data.isSaved }))
    },
  })

  const commentMutation = useMutation({
    mutationFn: (text: string) => postApi.addComment(postId, text),
    onSuccess: (newComment) => {
      setCommentText('')
      updatePostCache((current) => ({
        ...current,
        comments: [enrichComments([newComment], currentUser)[0], ...(current.comments ?? [])],
        commentsCount: (current.commentsCount ?? current.comments?.length ?? 0) + 1,
      }))
      queryClient.invalidateQueries({ queryKey: ['post', postId] })
    },
  })

  const commentLikeMutation = useMutation({
    mutationFn: (commentId: string) => postApi.toggleCommentLike(commentId),
    onSuccess: (data, commentId) => {
      updatePostCache((current) => ({
        ...current,
        comments: (current.comments ?? []).map((comment) =>
          comment._id === commentId
            ? { ...comment, isLiked: data.isLiked, likesCount: data.likesCount }
            : comment
        ),
      }))
    },
  })

  const handleSubmitComment = () => {
    const text = commentText.trim()
    if (!text || commentMutation.isPending || post?.commentsEnabled === false) return
    commentMutation.mutate(text)
  }

  if (isLoading || !post) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/65">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white border-t-transparent" />
      </div>
    )
  }

  const media = post.media[activeMedia] ?? post.media[0]
  const mediaUrl = resolveMediaUrl(media?.url)
  const likesCount = post.likesCount ?? post.likes?.length ?? 0
  const isOwner = currentUser?._id === post.author._id
  const commentsEnabled = post.commentsEnabled !== false
  const canGoPrev = navigation ? navigation.currentIndex > 0 : false
  const canGoNext = navigation
    ? navigation.currentIndex < navigation.totalCount - 1
    : false

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/65 p-4"
      onClick={onClose}
    >
      {canGoPrev && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            navigation?.onPrev()
          }}
          className="absolute left-4 top-1/2 z-[210] flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-lg transition hover:bg-white"
          aria-label="Предыдущая публикация"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}

      {canGoNext && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            navigation?.onNext()
          }}
          className="absolute right-4 top-1/2 z-[210] flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-lg transition hover:bg-white"
          aria-label="Следующая публикация"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}

      <button
        type="button"
        onClick={onClose}
        className="absolute right-6 top-6 text-white"
        aria-label="Закрыть"
      >
        <X className="h-7 w-7" />
      </button>

      <div
        className="flex h-[min(700px,90vh)] w-full max-w-[900px] overflow-hidden rounded-xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative flex w-[55%] items-center justify-center bg-black">
          {media?.type === 'video' ? (
            <video
              src={mediaUrl ?? ''}
              controls
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <img
              src={mediaUrl ?? ''}
              alt={post.caption || 'Публикация'}
              className="max-h-full max-w-full object-contain"
            />
          )}

          {post.media.length > 1 && (
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
              {post.media.map((item, index) => (
                <button
                  key={item._id ?? item.url}
                  type="button"
                  onClick={() => setActiveMedia(index)}
                  className={`h-1.5 w-1.5 rounded-full ${
                    activeMedia === index ? 'bg-white' : 'bg-white/40'
                  }`}
                  aria-label={`Медиа ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex w-[45%] flex-col">
          <div className="flex items-center justify-between border-b border-[#dbdbdb] px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <UserAvatar
                src={post.author.avatar}
                username={post.author.username}
                size={32}
              />
              <span className="truncate text-[14px] font-semibold text-black">
                {post.author.username}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowOptions(true)}
              className="text-[#262626]"
              aria-label="Ещё"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            {post.caption && (
              <div className="mb-4 flex gap-3">
                <UserAvatar
                  src={post.author.avatar}
                  username={post.author.username}
                  size={32}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] text-black">
                    <span className="mr-2 font-semibold">{post.author.username}</span>
                    {post.caption}
                  </p>
                  <p className="mt-1 text-[12px] text-[#8e8e8e]">
                    {formatRelativeTime(post.createdAt)}
                  </p>
                </div>
              </div>
            )}

            {post.location && (
              <p className="mb-4 text-[12px] text-[#8e8e8e]">{post.location}</p>
            )}

            {comments.map((comment) => (
              <CommentRow
                key={comment._id}
                comment={comment}
                onLike={() => commentLikeMutation.mutate(comment._id)}
                isLikePending={commentLikeMutation.isPending}
              />
            ))}
          </div>

          <div className="border-t border-[#dbdbdb] px-4 py-3">
            <div className="mb-3 flex items-center justify-between">
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
                <MessageCircle className="h-6 w-6" strokeWidth={1.5} />
                <Send className="h-6 w-6" strokeWidth={1.5} />
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

            <p className="mb-1 text-[14px] font-semibold text-black">
              {likesCount > 0
                ? `${likesCount} ${likesCount === 1 ? 'отметка' : 'отметок'} «Нравится»`
                : 'Поставьте первую отметку «Нравится»!'}
            </p>
            <p className="mb-3 text-[10px] uppercase text-[#8e8e8e]">
              {formatRelativeTimeLong(post.createdAt)}
            </p>

            <div className="flex items-center gap-3 border-t border-[#dbdbdb] pt-3">
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
                  <button
                    type="button"
                    onClick={handleSubmitComment}
                    disabled={!commentText.trim() || commentMutation.isPending}
                    className="text-[14px] font-semibold text-[#0095f6] disabled:opacity-40"
                  >
                    Опубликовать
                  </button>
                </>
              ) : (
                <p className="w-full text-center text-[14px] text-[#8e8e8e]">
                  Комментарии отключены.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {showOptions && (
        <PostOptionsModal
          post={post}
          isOwner={isOwner}
          onClose={() => setShowOptions(false)}
          onDeleted={() => {
            onClose()
            navigate(buildPath.feed())
          }}
        />
      )}
    </div>
  )
}

function CommentRow({
  comment,
  onLike,
  isLikePending,
}: {
  comment: PostComment
  onLike: () => void
  isLikePending: boolean
}) {
  return (
    <div className="mb-4 flex gap-3">
      <UserAvatar
        src={comment.author.avatar}
        username={comment.author.username}
        size={32}
      />
      <div className="min-w-0 flex-1">
        <p className="text-[14px] text-black">
          <span className="mr-2 font-semibold">{comment.author.username}</span>
          {comment.text}
        </p>
        <div className="mt-1 flex items-center gap-4 text-[12px] text-[#8e8e8e]">
          <span>{formatRelativeTime(comment.createdAt)}</span>
          {(comment.likesCount ?? 0) > 0 && (
            <span>
              {(comment.likesCount ?? 0)}{' '}
              {(comment.likesCount ?? 0) === 1 ? 'отметка' : 'отметок'} «Нравится»
            </span>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onLike}
        disabled={isLikePending}
        className="shrink-0 self-start pt-1"
        aria-label={comment.isLiked ? 'Убрать лайк' : 'Нравится'}
      >
        <Heart
          className={`h-3 w-3 ${
            comment.isLiked ? 'fill-[#ed4956] text-[#ed4956]' : 'text-[#8e8e8e]'
          }`}
          strokeWidth={1.5}
        />
      </button>
    </div>
  )
}
