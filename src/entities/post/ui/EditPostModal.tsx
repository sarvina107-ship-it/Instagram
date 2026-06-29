import { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, MapPin, Smile, X } from 'lucide-react'
import { useMe } from '@/features/auth'
import { UserAvatar } from '@/entities/user'
import { resolveMediaUrl } from '@/shared/lib/mediaUrl'
import { postApi } from '../api/postApi'
import { useHashtagSuggestions } from '../model/useHashtagSuggestions'
import { insertHashtagIntoCaption } from '../lib/hashtagUtils'
import { HashtagSuggestionsList } from './HashtagSuggestionsList'
import type { Post } from '../model/types'

type EditPostModalProps = {
  post: Post
  onClose: () => void
}

const CAPTION_MAX = 2200

export const EditPostModal = ({ post, onClose }: EditPostModalProps) => {
  const { data: user } = useMe()
  const queryClient = useQueryClient()
  const captionRef = useRef<HTMLTextAreaElement>(null)

  const [caption, setCaption] = useState(post.caption ?? '')
  const [captionCursor, setCaptionCursor] = useState(0)
  const [location, setLocation] = useState(post.location ?? '')
  const [showLocation, setShowLocation] = useState(Boolean(post.location))
  const [activeMedia, setActiveMedia] = useState(0)

  const { data: hashtagSuggestions = [], isFetching: isHashtagLoading } =
    useHashtagSuggestions(caption, captionCursor, true)

  const updateMutation = useMutation({
    mutationFn: () =>
      postApi.update(post._id, {
        caption: caption.trim(),
        location: location.trim(),
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['post', post._id], updated)
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      onClose()
    },
  })

  const media = post.media[activeMedia] ?? post.media[0]
  const mediaUrl = resolveMediaUrl(media?.url)

  const handleCaptionChange = (value: string, cursor: number) => {
    setCaption(value.slice(0, CAPTION_MAX))
    setCaptionCursor(Math.min(cursor, CAPTION_MAX))
  }

  const handleSelectHashtag = (tag: string) => {
    const result = insertHashtagIntoCaption(caption, captionCursor, tag)
    setCaption(result.caption)
    setCaptionCursor(result.cursorPosition)

    requestAnimationFrame(() => {
      const textarea = captionRef.current
      if (!textarea) return
      textarea.focus()
      textarea.setSelectionRange(result.cursorPosition, result.cursorPosition)
    })
  }

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/65 p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute left-6 top-6 text-white"
        aria-label="Назад"
      >
        <ArrowLeft className="h-7 w-7" />
      </button>

      <div
        className="flex h-[min(600px,85vh)] w-full max-w-[900px] overflow-hidden rounded-xl bg-white shadow-2xl"
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
            <h2 className="flex-1 text-center text-[16px] font-semibold text-black">
              Редактирование
            </h2>
            <button type="button" onClick={onClose} aria-label="Закрыть">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-4 flex items-center gap-3">
              <UserAvatar
                src={user?.avatar}
                username={user?.username ?? ''}
                size={28}
              />
              <span className="text-[14px] font-semibold">{user?.username}</span>
            </div>

            <textarea
              ref={captionRef}
              value={caption}
              onChange={(event) =>
                handleCaptionChange(
                  event.target.value,
                  event.target.selectionStart ?? event.target.value.length
                )
              }
              onSelect={(event) =>
                setCaptionCursor(
                  (event.target as HTMLTextAreaElement).selectionStart ?? 0
                )
              }
              placeholder="Напишите подпись..."
              className="mb-2 min-h-[120px] w-full resize-none text-[14px] outline-none placeholder:text-[#8e8e8e]"
            />

            <HashtagSuggestionsList
              suggestions={hashtagSuggestions}
              isLoading={isHashtagLoading}
              onSelect={handleSelectHashtag}
            />

            <div className="mt-2 flex items-center justify-between text-[12px] text-[#8e8e8e]">
              <Smile className="h-5 w-5" />
              <span>
                {caption.length}/{CAPTION_MAX}
              </span>
            </div>

            {showLocation ? (
              <div className="mt-4 flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-[#8e8e8e]" />
                <input
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="Добавить место"
                  className="flex-1 text-[14px] outline-none placeholder:text-[#8e8e8e]"
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowLocation(true)}
                className="mt-4 flex items-center gap-2 text-[14px] text-[#0095f6]"
              >
                <MapPin className="h-4 w-4" />
                Добавить место
              </button>
            )}
          </div>

          <div className="border-t border-[#dbdbdb] p-4">
            <button
              type="button"
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
              className="w-full rounded-lg bg-[#0095f6] py-2 text-[14px] font-semibold text-white transition hover:bg-[#1877f2] disabled:opacity-50"
            >
              {updateMutation.isPending ? 'Сохранение...' : 'Изменить'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
