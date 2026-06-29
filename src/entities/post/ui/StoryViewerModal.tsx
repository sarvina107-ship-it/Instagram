import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Heart, Send, Trash2, X } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useMe } from '@/features/auth'
import { UserAvatar } from '@/entities/user'
import type { User } from '@/entities/user/model/types'
import { buildPath } from '@/shared/config/routes'
import { resolveMediaUrl } from '@/shared/lib/mediaUrl'
import { storyApi, type StoryGroup, type StoryItem, type StoryViewerUser } from '../api/storyApi'
import { filterValidStories } from '../lib/storyUtils'
import { useUserStories } from '../model/useUserStories'
import { formatRelativeTime } from '../lib/formatTime'

type StoryViewerModalProps = {
  isOpen: boolean
  onClose: () => void
  groups: StoryGroup[]
  initialGroupIndex?: number
  initialStoryIndex?: number
}

const IMAGE_DURATION_MS = 5500

export const StoryViewerModal = ({
  isOpen,
  onClose,
  groups,
  initialGroupIndex = 0,
  initialStoryIndex = 0,
}: StoryViewerModalProps) => {
  const navigate = useNavigate()
  const { data: me } = useMe()
  const queryClient = useQueryClient()

  const [groupIndex, setGroupIndex] = useState(initialGroupIndex)
  const [storyIndex, setStoryIndex] = useState(initialStoryIndex)
  const [localStories, setLocalStories] = useState<StoryItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showViewers, setShowViewers] = useState(false)
  const timerRef = useRef<number | null>(null)

  const currentGroup = groups[groupIndex]
  const current = localStories[storyIndex]
  const isOwn = currentGroup?.author._id === me?._id
  const mediaType = current?.media?.type === 'video' ? 'video' : 'image'
  const mediaUrl = resolveMediaUrl(current?.media?.url)

  const { data: liveUserStories } = useUserStories(
    isOwn ? me?._id : undefined,
    isOpen && isOwn,
    isOpen && isOwn ? 3000 : undefined
  )

  const liveStory = useMemo(
    () => liveUserStories?.find((s) => s._id === current?._id),
    [current?._id, liveUserStories]
  )

  const liveViewsCount = liveStory?.viewsCount ?? current?.viewsCount ?? 0

  const { data: fetchedViewers = [], isLoading: isViewersLoading } = useQuery({
    queryKey: ['stories', 'viewers', current?._id],
    queryFn: () => storyApi.getViewers(current!._id),
    enabled: isOpen && isOwn && !!current?._id && showViewers,
    retry: false,
  })

  const viewers: StoryViewerUser[] = useMemo(() => {
    if (fetchedViewers.length) return fetchedViewers
    if (liveStory?.viewers?.length) return liveStory.viewers
    if (current?.viewers?.length) return current.viewers
    return []
  }, [current?.viewers, fetchedViewers, liveStory?.viewers])

  const followers = useMemo(() => {
    return (me?.followers ?? [])
      .map((item) => (typeof item === 'object' ? item : null))
      .filter((user): user is User => !!user)
  }, [me?.followers])

  const viewerIds = useMemo(() => new Set(viewers.map((v) => v._id)), [viewers])

  const notViewedFollowers = useMemo(
    () => followers.filter((follower) => !viewerIds.has(follower._id)),
    [followers, viewerIds]
  )

  const resetPosition = useCallback(() => {
    setGroupIndex(initialGroupIndex)
    setStoryIndex(initialStoryIndex)
    setShowViewers(false)
    setError(null)
  }, [initialGroupIndex, initialStoryIndex])

  useEffect(() => {
    if (!isOpen) return
    resetPosition()
  }, [isOpen, initialGroupIndex, initialStoryIndex, resetPosition])

  useEffect(() => {
    if (!currentGroup) return
    const validStories = filterValidStories(currentGroup.stories)
    setLocalStories(validStories)
    setStoryIndex((prev) => Math.min(prev, Math.max(0, validStories.length - 1)))
    setShowViewers(false)
  }, [currentGroup])

  const { mutate: markViewed } = useMutation({
    mutationFn: (storyId: string) => storyApi.markViewed(storyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] })
    },
  })

  const { mutate: toggleLike, isPending: isLikePending } = useMutation({
    mutationFn: (storyId: string) => storyApi.toggleLike(storyId),
    onMutate: async (storyId) => {
      setError(null)
      setLocalStories((prev) =>
        prev.map((s) => {
          if (s._id !== storyId) return s
          const nextIsLiked = !(s.isLiked ?? false)
          const nextLikesCount = Math.max(0, (s.likesCount ?? 0) + (nextIsLiked ? 1 : -1))
          return { ...s, isLiked: nextIsLiked, likesCount: nextLikesCount }
        })
      )
    },
    onError: () => {
      setError('Не удалось поставить лайк.')
      queryClient.invalidateQueries({ queryKey: ['stories'] })
    },
  })

  const { mutate: deleteStory, isPending: isDeletePending } = useMutation({
    mutationFn: (storyId: string) => storyApi.delete(storyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] })
      queryClient.invalidateQueries({ queryKey: ['stories', 'user'] })

      setLocalStories((prev) => {
        const next = prev.filter((s) => s._id !== current?._id)
        if (next.length === 0) {
          if (groups.length <= 1) {
            onClose()
          } else if (groupIndex < groups.length - 1) {
            setGroupIndex((idx) => idx + 1)
            setStoryIndex(0)
          } else {
            onClose()
          }
          return next
        }
        setStoryIndex((idx) => Math.max(0, Math.min(idx, next.length - 1)))
        return next
      })
    },
    onError: () => setError('Не удалось удалить сторис.'),
  })

  useEffect(() => {
    if (!isOpen || !current?._id || isOwn) return

    if (!current.seen) {
      markViewed(current._id)
      setLocalStories((prev) =>
        prev.map((s, i) => (i === storyIndex ? { ...s, seen: true } : s))
      )
    }
  }, [current?._id, current?.seen, isOpen, isOwn, markViewed, storyIndex])

  const clearTimer = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = null
  }

  const goToNext = useCallback(() => {
    if (storyIndex < localStories.length - 1) {
      setStoryIndex((prev) => prev + 1)
      return
    }

    if (groupIndex < groups.length - 1) {
      setGroupIndex((prev) => prev + 1)
      setStoryIndex(0)
      return
    }

    onClose()
  }, [groupIndex, groups.length, localStories.length, onClose, storyIndex])

  const goToPrev = useCallback(() => {
    if (storyIndex > 0) {
      setStoryIndex((prev) => prev - 1)
      return
    }

    if (groupIndex > 0) {
      const prevGroup = groups[groupIndex - 1]
      setGroupIndex((prev) => prev - 1)
      setStoryIndex(Math.max(0, (prevGroup?.stories.length ?? 1) - 1))
    }
  }, [groupIndex, groups, storyIndex])

  useEffect(() => {
    if (!isOpen || !current?._id || showViewers) return
    clearTimer()

    if (mediaType === 'image') {
      timerRef.current = window.setTimeout(goToNext, IMAGE_DURATION_MS)
    }

    return () => clearTimer()
  }, [current?._id, goToNext, isOpen, mediaType, showViewers])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowRight') goToNext()
      if (event.key === 'ArrowLeft') goToPrev()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToNext, goToPrev, isOpen, onClose])

  if (!isOpen || !currentGroup || !current || !mediaUrl) return null

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-[#1a1a1a]">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-5 top-5 z-30 text-white"
        aria-label="Закрыть"
      >
        <X className="h-7 w-7" />
      </button>

      <div className="relative h-[min(92vh,780px)] w-[min(100vw,420px)] overflow-hidden rounded-xl bg-black shadow-2xl">
        <div className="absolute inset-0 z-0">
          {mediaType === 'video' ? (
            <video
              key={current._id}
              src={mediaUrl}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
              onEnded={goToNext}
            />
          ) : (
            <img
              key={current._id}
              src={mediaUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/55" />
        </div>

        <div className="absolute left-0 right-0 top-0 z-20 px-3 pb-3 pt-3">
          <div className="mb-3 flex gap-1">
            {localStories.map((_, i) => (
              <div key={i} className="h-[2px] flex-1 overflow-hidden rounded bg-white/35">
                <div
                  className="h-full rounded bg-white transition-all duration-300"
                  style={{
                    width: i < storyIndex ? '100%' : i === storyIndex ? '45%' : '0%',
                  }}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate(buildPath.profile(currentGroup.author.username))}
              className="flex min-w-0 items-center gap-2 text-white"
            >
              <UserAvatar
                src={currentGroup.author.avatar}
                username={currentGroup.author.username}
                size={32}
              />
              <div className="min-w-0 text-left">
                <div className="truncate text-[14px] font-semibold">
                  {currentGroup.author.username}
                </div>
                <div className="text-[12px] text-white/80">
                  {formatRelativeTime(current.createdAt)}
                </div>
              </div>
            </button>

            {isOwn && (
              <button
                type="button"
                onClick={() => current?._id && deleteStory(current._id)}
                disabled={isDeletePending}
                className="rounded-lg px-2 py-1 text-white/90 hover:bg-white/10 disabled:opacity-50"
                aria-label="Удалить"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={goToPrev}
          className="absolute left-0 top-0 z-10 h-full w-[35%]"
          aria-label="Предыдущая"
        />
        <button
          type="button"
          onClick={goToNext}
          className="absolute right-0 top-0 z-10 h-full w-[35%]"
          aria-label="Следующая"
        />

        {current.caption && (
          <div className="absolute bottom-20 left-0 right-0 z-20 px-4">
            <p className="text-[14px] font-medium text-white drop-shadow">{current.caption}</p>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-4">
          {isOwn ? (
            <button
              type="button"
              onClick={() => setShowViewers((prev) => !prev)}
              className="flex w-full items-center justify-center rounded-full bg-white/15 px-4 py-3 text-[14px] font-semibold text-white backdrop-blur-sm hover:bg-white/20"
            >
              Просмотров: {liveViewsCount}
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex min-w-0 flex-1 items-center rounded-full border border-white/30 bg-black/20 px-4 py-3 text-[14px] text-white/70 backdrop-blur-sm">
                Ответьте {currentGroup.author.username}...
              </div>
              <button
                type="button"
                onClick={() => current?._id && toggleLike(current._id)}
                disabled={isLikePending}
                className="rounded-full p-2 text-white hover:bg-white/10 disabled:opacity-50"
                aria-label="Лайк"
              >
                <Heart
                  className={`h-6 w-6 ${
                    current.isLiked ? 'fill-[#ff3040] text-[#ff3040]' : ''
                  }`}
                />
              </button>
              <button
                type="button"
                className="rounded-full p-2 text-white hover:bg-white/10"
                aria-label="Отправить"
              >
                <Send className="h-6 w-6" />
              </button>
            </div>
          )}
        </div>

        {showViewers && isOwn && (
          <div className="absolute inset-x-0 bottom-0 z-30 max-h-[55%] overflow-hidden rounded-t-2xl bg-white text-black">
            <div className="flex items-center justify-between border-b border-[#dbdbdb] px-4 py-3">
              <span className="text-[14px] font-semibold">Просмотры</span>
              <button
                type="button"
                onClick={() => setShowViewers(false)}
                className="text-[#8e8e8e]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[calc(55vh-52px)] overflow-y-auto px-4 py-3">
              {isViewersLoading && (
                <p className="py-4 text-center text-[14px] text-[#8e8e8e]">Загрузка...</p>
              )}

              {!isViewersLoading && viewers.length > 0 && (
                <div className="mb-5">
                  <p className="mb-2 text-[12px] font-semibold uppercase text-[#8e8e8e]">
                    Просмотрели
                  </p>
                  <div className="space-y-3">
                    {viewers.map((viewer) => (
                      <button
                        key={viewer._id}
                        type="button"
                        onClick={() => navigate(buildPath.profile(viewer.username))}
                        className="flex w-full items-center gap-3 text-left"
                      >
                        <UserAvatar
                          src={viewer.avatar}
                          username={viewer.username}
                          size={44}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-semibold">
                            {viewer.username}
                          </p>
                          {viewer.fullName && (
                            <p className="truncate text-[14px] text-[#8e8e8e]">
                              {viewer.fullName}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!isViewersLoading && viewers.length === 0 && liveViewsCount === 0 && (
                <p className="py-4 text-center text-[14px] text-[#8e8e8e]">
                  Пока никто не посмотрел
                </p>
              )}

              {notViewedFollowers.length > 0 && (
                <div>
                  <p className="mb-2 text-[12px] font-semibold uppercase text-[#8e8e8e]">
                    Не просмотрели
                  </p>
                  <div className="space-y-3">
                    {notViewedFollowers.map((follower) => (
                      <button
                        key={follower._id}
                        type="button"
                        onClick={() => navigate(buildPath.profile(follower.username))}
                        className="flex w-full items-center gap-3 text-left opacity-70"
                      >
                        <UserAvatar
                          src={follower.avatar}
                          username={follower.username}
                          size={44}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-semibold">
                            {follower.username}
                          </p>
                          {follower.fullName && (
                            <p className="truncate text-[14px] text-[#8e8e8e]">
                              {follower.fullName}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="absolute bottom-24 left-4 right-4 z-30 rounded-lg bg-black/70 px-3 py-2 text-[12px] text-red-200">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
