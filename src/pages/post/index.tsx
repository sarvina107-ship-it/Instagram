import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Bookmark,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Send,
  Smile,
} from 'lucide-react'
import { AppLayout } from '@/widgets/app-layout/ui/AppLayout'
import { useMe } from '@/features/auth'
import { UserAvatar } from '@/entities/user'
import { resolveMediaUrl } from '@/shared/lib/mediaUrl'
import { buildPath } from '@/shared/config/routes'
import { postApi } from '@/entities/post/api/postApi'
import { enrichComments } from '@/entities/post/lib/commentUtils'
import {
  formatRelativeTime,
  formatRelativeTimeLong,
} from '@/entities/post/lib/formatTime'
import { PostOptionsModal } from '@/entities/post/ui/PostOptionsModal'
import type { Post, PostComment } from '@/entities/post/model/types'

const FOOTER_LINKS = [
  'Meta',
  'Информация',
  'Блог',
  'Вакансии',
  'Справка',
  'API',
  'Конфиденциальность',
  'Условия',
  'Места',
  'Язык',
  'Meta Verified',
]

export default function PostPage() {
  const { postId } = useParams<{ postId: string }>()
  const navigate = useNavigate()
  const { data: currentUser } = useMe()
  const queryClient = useQueryClient()

  const [commentText, setCommentText] = useState('')
  const [activeMedia, setActiveMedia] = useState(0)
  const [showOptions, setShowOptions] = useState(false)

  const { data: post, isLoading } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => postApi.getById(postId!),
    enabled: Boolean(postId),
  })

  useEffect(() => {
    setCommentText('')
    setActiveMedia(0)
  }, [postId])

  const updatePostCache = (updater: (current: Post) => Post) => {
    queryClient.setQueryData<Post>(['post', postId], (current) =>
      current ? updater(current) : current
    )
  }

  const likeMutation = useMutation({
    mutationFn: () => postApi.toggleLike(postId!),
    onMutate: async () => {
      const previous = queryClient.getQueryData<Post>(['post', postId])
      if (previous) {
        const nextLiked = !previous.isLiked
        updatePostCache((current) => ({
          ...current,
          isLiked: nextLiked,
          likesCount: Math.max(
            0,
            (current.likesCount ?? 0) + (nextLiked ? 1 : -1)
          ),
        }))
      }
      return { previous }
    },
    onError: (_e, _v, context) => {
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
    },
  })

  const saveMutation = useMutation({
    mutationFn: () => postApi.toggleSave(postId!),
    onSuccess: (data) => {
      updatePostCache((current) => ({ ...current, isSaved: data.isSaved }))
    },
  })

  const commentMutation = useMutation({
    mutationFn: (text: string) => postApi.addComment(postId!, text),
    onSuccess: (newComment) => {
      setCommentText('')
      updatePostCache((current) => ({
        ...current,
        comments: [
          enrichComments([newComment], currentUser)[0],
          ...(current.comments ?? []),
        ],
        commentsCount: (current.commentsCount ?? 0) + 1,
      }))
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

  if (isLoading || !post) {
    return (
      <AppLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#dbdbdb] border-t-[#262626]" />
        </div>
      </AppLayout>
    )
  }

  const isOwner = currentUser?._id === post.author._id
  const commentsEnabled = post.commentsEnabled !== false
  const comments = enrichComments(post.comments, currentUser)
  const media = post.media[activeMedia] ?? post.media[0]
  const mediaUrl = resolveMediaUrl(media?.url)
  const likesCount = post.likesCount ?? post.likes?.length ?? 0

  const handleSubmitComment = () => {
    const text = commentText.trim()
    if (!text || commentMutation.isPending || !commentsEnabled) return
    commentMutation.mutate(text)
  }

  return (
    <AppLayout>
      <div className="mx-auto flex min-h-screen max-w-[935px] flex-col px-5 py-8">
        <div className="flex flex-1 items-start justify-center">
          <div className="flex w-full max-w-[935px] overflow-hidden rounded border border-[#dbdbdb] bg-white">
            <div className="relative flex w-[60%] items-center justify-center bg-black">
              {media?.type === 'video' ? (
                <video
                  src={mediaUrl ?? ''}
                  controls
                  className="max-h-[min(800px,85vh)] w-full object-contain"
                />
              ) : (
                <img
                  src={mediaUrl ?? ''}
                  alt={post.caption || 'Публикация'}
                  className="max-h-[min(800px,85vh)] w-full object-contain"
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
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="flex w-[40%] min-w-[335px] flex-col">
              <div className="flex items-center justify-between border-b border-[#dbdbdb] px-4 py-3">
                <button
                  type="button"
                  onClick={() => navigate(buildPath.profile(post.author.username))}
                  className="flex min-w-0 items-center gap-3"
                >
                  <UserAvatar
                    src={post.author.avatar}
                    username={post.author.username}
                    size={32}
                  />
                  <span className="truncate text-[14px] font-semibold text-black">
                    {post.author.username}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowOptions(true)}
                  aria-label="Ещё"
                >
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4">
                {post.caption ? (
                  <div className="mb-4 flex gap-3">
                    <UserAvatar
                      src={post.author.avatar}
                      username={post.author.username}
                      size={32}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] text-black">
                        <span className="mr-2 font-semibold">
                          {post.author.username}
                        </span>
                        {post.caption}
                      </p>
                      <p className="mt-1 text-[12px] text-[#8e8e8e]">
                        {formatRelativeTime(post.createdAt)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="mb-4 text-center text-[14px] text-[#8e8e8e]">
                    Комментариев пока нет.
                    <br />
                    Начните переписку.
                  </p>
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
                    >
                      <Heart
                        className={`h-6 w-6 ${
                          post.isLiked
                            ? 'fill-[#ed4956] text-[#ed4956]'
                            : 'text-black'
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
                    ? `${likesCount.toLocaleString('ru-RU')} ${
                        likesCount === 1 ? 'отметка' : 'отметок'
                      } «Нравится»`
                    : 'Поставьте первую отметку «Нравится»!'}
                </p>
                <p className="mb-3 text-[10px] uppercase text-[#8e8e8e]">
                  {formatRelativeTimeLong(post.createdAt)}
                </p>

                {commentsEnabled ? (
                  <div className="flex items-center gap-3 border-t border-[#dbdbdb] pt-3">
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
                  </div>
                ) : (
                  <p className="border-t border-[#dbdbdb] pt-3 text-center text-[14px] text-[#8e8e8e]">
                    Комментарии отключены.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <footer className="mt-12 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[12px] text-[#8e8e8e]">
          {FOOTER_LINKS.map((link) => (
            <span key={link}>{link}</span>
          ))}
          <span>© 2026 Instagram from Meta</span>
        </footer>
      </div>

      {showOptions && (
        <PostOptionsModal
          post={post}
          isOwner={isOwner}
          onClose={() => setShowOptions(false)}
          onDeleted={() => navigate(buildPath.feed())}
        />
      )}
    </AppLayout>
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
        </div>
      </div>
      <button
        type="button"
        onClick={onLike}
        disabled={isLikePending}
        className="shrink-0 self-start pt-1"
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
