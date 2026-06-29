import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Bookmark,
  ChevronDown,
  ChevronUp,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Music2,
  Send,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { AppLayout } from '@/widgets/app-layout/ui/AppLayout'
import { useMe } from '@/features/auth'
import { UserAvatar } from '@/entities/user'
import { resolveMediaUrl } from '@/shared/lib/mediaUrl'
import { buildPath } from '@/shared/config/routes'
import { postApi } from '@/entities/post/api/postApi'
import { enrichPosts } from '@/entities/post/lib/enrichPost'
import type { Post } from '@/entities/post/model/types'

export default function ReelsPage() {
  const { data: currentUser } = useMe()
  const [activeIndex, setActiveIndex] = useState(0)

  const { data: reels = [], isLoading, refetch } = useQuery({
    queryKey: ['reels'],
    queryFn: () => postApi.getReels(30),
    staleTime: 0,
    refetchOnMount: 'always',
    select: (data) => enrichPosts(data, currentUser),
  })

  useEffect(() => {
    refetch()
  }, [refetch])

  useEffect(() => {
    setActiveIndex(0)
  }, [reels])

  const goPrev = useCallback(() => {
    setActiveIndex((index) => Math.max(0, index - 1))
  }, [])

  const goNext = useCallback(() => {
    setActiveIndex((index) => Math.min(reels.length - 1, index + 1))
  }, [reels.length])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowUp') goPrev()
      if (event.key === 'ArrowDown') goNext()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goPrev, goNext])

  const activeReel = reels[activeIndex]

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#dbdbdb] border-t-[#262626]" />
        </div>
      </AppLayout>
    )
  }

  if (!reels.length) {
    return (
      <AppLayout>
        <div className="flex min-h-screen flex-col items-center justify-center gap-2 text-[#8e8e8e]">
          <p className="text-[18px] font-semibold text-black">Reels пока нет</p>
          <p className="text-[14px]">Опубликуйте видео, чтобы увидеть его здесь</p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="relative flex min-h-screen items-center justify-center bg-[#fafafa]">
        <div className="flex items-center gap-6">
          <ReelPlayer key={activeReel._id} post={activeReel} />

          <div className="flex flex-col gap-4">
            <button
              type="button"
              onClick={goPrev}
              disabled={activeIndex === 0}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#dbdbdb] bg-white shadow transition hover:bg-[#fafafa] disabled:opacity-30"
              aria-label="Предыдущий Reel"
            >
              <ChevronUp className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={activeIndex >= reels.length - 1}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#dbdbdb] bg-white shadow transition hover:bg-[#fafafa] disabled:opacity-30"
              aria-label="Следующий Reel"
            >
              <ChevronDown className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

function ReelPlayer({ post }: { post: Post }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const videoRef = useRef<HTMLVideoElement>(null)

  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(true)
  const [showCommentInput, setShowCommentInput] = useState(false)
  const [commentText, setCommentText] = useState('')

  const videoMedia = post.media.find((m) => m.type === 'video') ?? post.media[0]
  const videoUrl = resolveMediaUrl(videoMedia?.url)
  const likesCount = post.likesCount ?? 0
  const commentsCount = post.commentsCount ?? post.comments?.length ?? 0
  const commentsEnabled = post.commentsEnabled !== false

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = isMuted
    if (isPlaying) {
      video.play().catch(() => setIsPlaying(false))
    } else {
      video.pause()
    }
  }, [isPlaying, isMuted, post._id])

  const likeMutation = useMutation({
    mutationFn: () => postApi.toggleLike(post._id),
    onMutate: async () => {
      const nextLiked = !post.isLiked
      queryClient.setQueryData<Post[]>(['reels'], (reels) =>
        reels?.map((r) =>
          r._id === post._id
            ? {
                ...r,
                isLiked: nextLiked,
                likesCount: Math.max(0, (r.likesCount ?? 0) + (nextLiked ? 1 : -1)),
              }
            : r
        )
      )
    },
    onSuccess: (data) => {
      queryClient.setQueryData<Post[]>(['reels'], (reels) =>
        reels?.map((r) =>
          r._id === post._id
            ? { ...r, isLiked: data.isLiked, likesCount: data.likesCount }
            : r
        )
      )
    },
  })

  const saveMutation = useMutation({
    mutationFn: () => postApi.toggleSave(post._id),
    onSuccess: (data) => {
      queryClient.setQueryData<Post[]>(['reels'], (reels) =>
        reels?.map((r) =>
          r._id === post._id ? { ...r, isSaved: data.isSaved } : r
        )
      )
    },
  })

  const commentMutation = useMutation({
    mutationFn: (text: string) => postApi.addComment(post._id, text),
    onSuccess: () => {
      setCommentText('')
      setShowCommentInput(false)
      queryClient.setQueryData<Post[]>(['reels'], (reels) =>
        reels?.map((r) =>
          r._id === post._id
            ? { ...r, commentsCount: (r.commentsCount ?? 0) + 1 }
            : r
        )
      )
    },
  })

  const togglePlay = () => setIsPlaying((playing) => !playing)
  const toggleMute = (event: MouseEvent) => {
    event.stopPropagation()
    setIsMuted((muted) => !muted)
  }

  const formatCount = (count: number) => {
    if (count >= 1_000_000) return `${(count / 1_000_000).toLocaleString('ru-RU', { maximumFractionDigits: 1 })}`
    if (count >= 1_000) return `${(count / 1_000).toLocaleString('ru-RU', { maximumFractionDigits: 1 })}`
    return count.toLocaleString('ru-RU')
  }

  return (
    <div className="relative flex items-end gap-4">
      <div className="relative">
        <div
          className="relative h-[min(85vh,700px)] w-[min(400px,50vw)] cursor-pointer overflow-hidden rounded-lg bg-black"
          onClick={togglePlay}
        >
          <video
            ref={videoRef}
            src={videoUrl ?? ''}
            loop
            playsInline
            muted={isMuted}
            className="h-full w-full object-cover"
          />

          {!isPlaying && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/40">
                <div className="ml-1 h-0 w-0 border-y-[12px] border-l-[20px] border-y-transparent border-l-white" />
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={toggleMute}
            className="absolute bottom-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
            aria-label={isMuted ? 'Включить звук' : 'Выключить звук'}
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="mt-3 max-w-[400px]">
          <button
            type="button"
            onClick={() => navigate(buildPath.profile(post.author.username))}
            className="mb-2 flex items-center gap-2"
          >
            <UserAvatar
              src={post.author.avatar}
              username={post.author.username}
              size={32}
            />
            <span className="text-[14px] font-semibold text-black">
              {post.author.username}
            </span>
          </button>

          {post.caption && (
            <p className="line-clamp-2 text-[14px] text-black">{post.caption}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center gap-5 pb-20">
        <ActionButton
          icon={
            <Heart
              className={`h-7 w-7 ${
                post.isLiked ? 'fill-[#ed4956] text-[#ed4956]' : 'text-black'
              }`}
              strokeWidth={1.5}
            />
          }
          label={formatCount(likesCount)}
          onClick={() => likeMutation.mutate()}
        />

        <ActionButton
          icon={<MessageCircle className="h-7 w-7" strokeWidth={1.5} />}
          label={formatCount(commentsCount)}
          onClick={() => {
            if (commentsEnabled) setShowCommentInput((show) => !show)
          }}
        />

        <ActionButton
          icon={<Send className="h-7 w-7" strokeWidth={1.5} />}
          label=""
          onClick={() => {}}
        />

        <ActionButton
          icon={
            <Bookmark
              className={`h-7 w-7 ${
                post.isSaved ? 'fill-black text-black' : 'text-black'
              }`}
              strokeWidth={1.5}
            />
          }
          label=""
          onClick={() => saveMutation.mutate()}
        />

        <ActionButton
          icon={<MoreHorizontal className="h-7 w-7" strokeWidth={1.5} />}
          label=""
          onClick={() => navigate(buildPath.post(post._id))}
        />

        <div className="mt-2 flex h-10 w-10 items-center justify-center rounded-lg border border-[#dbdbdb] bg-[#fafafa]">
          <Music2 className="h-5 w-5 text-black" />
        </div>
      </div>

      {showCommentInput && commentsEnabled && (
        <div className="absolute bottom-24 left-1/2 z-10 flex w-[min(400px,90vw)] -translate-x-1/2 gap-2 rounded-lg border border-[#dbdbdb] bg-white p-3 shadow-lg">
          <input
            value={commentText}
            onChange={(event) => setCommentText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && commentText.trim()) {
                commentMutation.mutate(commentText.trim())
              }
            }}
            placeholder="Добавьте комментарий..."
            className="flex-1 text-[14px] outline-none"
            autoFocus
          />
          <button
            type="button"
            onClick={() => {
              if (commentText.trim()) commentMutation.mutate(commentText.trim())
            }}
            disabled={!commentText.trim() || commentMutation.isPending}
            className="text-[14px] font-semibold text-[#0095f6] disabled:opacity-40"
          >
            Опубликовать
          </button>
        </div>
      )}
    </div>
  )
}

function ActionButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1"
    >
      {icon}
      {label && (
        <span className="text-[12px] font-semibold text-black">{label}</span>
      )}
    </button>
  )
}
