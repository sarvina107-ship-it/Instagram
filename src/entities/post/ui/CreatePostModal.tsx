import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { ArrowLeft, Image as ImageIcon, MapPin, Smile, X } from 'lucide-react'
import { useMe } from '@/features/auth'
import { UserAvatar } from '@/entities/user'
import { useCreatePost } from '../model/useCreatePost'
import { useHashtagSuggestions } from '../model/useHashtagSuggestions'
import { insertHashtagIntoCaption } from '../lib/hashtagUtils'
import { HashtagSuggestionsList } from './HashtagSuggestionsList'

type CreatePostModalProps = {
  onClose: () => void
}

type Step = 'select' | 'edit' | 'success'

const CAPTION_MAX = 2200

export const CreatePostModal = ({ onClose }: CreatePostModalProps) => {
  const { data: user } = useMe()
  const { mutate: createPost, isPending } = useCreatePost()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const captionRef = useRef<HTMLTextAreaElement>(null)

  const [step, setStep] = useState<Step>('select')
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [caption, setCaption] = useState('')
  const [captionCursor, setCaptionCursor] = useState(0)
  const [location, setLocation] = useState('')
  const [showLocation, setShowLocation] = useState(false)
  const [activePreview, setActivePreview] = useState(0)

  const { data: hashtagSuggestions = [], isFetching: isHashtagLoading } =
    useHashtagSuggestions(caption, captionCursor, step === 'edit')

  const resetFiles = () => {
    previews.forEach((url) => URL.revokeObjectURL(url))
    setFiles([])
    setPreviews([])
    setActivePreview(0)
  }

  const handleClose = () => {
    resetFiles()
    onClose()
  }

  const handleFilesSelected = (selected: FileList | File[]) => {
    const nextFiles = Array.from(selected).slice(0, 10)
    if (!nextFiles.length) return

    previews.forEach((url) => URL.revokeObjectURL(url))
    const nextPreviews = nextFiles.map((file) => URL.createObjectURL(file))
    setFiles(nextFiles)
    setPreviews(nextPreviews)
    setActivePreview(0)
    setStep('edit')
  }

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) handleFilesSelected(event.target.files)
    event.target.value = ''
  }

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (event.dataTransfer.files.length) {
      handleFilesSelected(event.dataTransfer.files)
    }
  }

  const handlePublish = () => {
    if (!files.length || isPending) return

    createPost(
      {
        media: files,
        caption: caption.trim(),
        location: location.trim(),
      },
      {
        onSuccess: () => {
          resetFiles()
          setCaption('')
          setLocation('')
          setShowLocation(false)
          setStep('success')
        },
      }
    )
  }

  const currentPreview = previews[activePreview]
  const currentType = files[activePreview]?.type.startsWith('video') ? 'video' : 'image'

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
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/65 p-4"
      onClick={handleClose}
    >
      <button
        type="button"
        onClick={handleClose}
        className="absolute right-6 top-6 text-white"
        aria-label="Закрыть"
      >
        <X className="h-7 w-7" />
      </button>

      <div
        className={`overflow-hidden rounded-xl bg-white shadow-2xl ${
          step === 'edit' ? 'flex h-[min(700px,90vh)] w-full max-w-[900px]' : 'w-full max-w-[540px]'
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        {step === 'select' && (
          <>
            <div className="border-b border-[#dbdbdb] px-4 py-4">
              <h2 className="text-center text-[16px] font-bold text-black">
                Создание публикации
              </h2>
            </div>

            <div
              className="flex flex-col items-center px-8 py-16"
              onDragOver={(event) => event.preventDefault()}
              onDrop={onDrop}
            >
              <div className="mb-4 flex items-center gap-2 text-[#262626]">
                <ImageIcon className="h-12 w-12" strokeWidth={1} />
              </div>
              <p className="mb-5 text-[20px] text-black">
                Перетащите сюда фото и видео
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg bg-[#0095f6] px-4 py-[7px] text-[14px] font-semibold text-white hover:bg-[#1877f2]"
              >
                Выбрать на компьютере
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={onInputChange}
              />
            </div>
          </>
        )}

        {step === 'edit' && currentPreview && (
          <>
            <div className="flex w-[55%] items-center justify-center bg-black">
              {currentType === 'video' ? (
                <video
                  src={currentPreview}
                  controls
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <img
                  src={currentPreview}
                  alt=""
                  className="max-h-full max-w-full object-contain"
                />
              )}
            </div>

            <div className="flex w-[45%] flex-col">
              <div className="flex items-center justify-between border-b border-[#dbdbdb] px-4 py-3">
                <button
                  type="button"
                  onClick={() => {
                    resetFiles()
                    setStep('select')
                  }}
                  className="text-[#262626]"
                  aria-label="Назад"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <h2 className="text-[16px] font-bold text-black">Создание публикации</h2>
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={isPending}
                  className="text-[14px] font-semibold text-[#0095f6] disabled:opacity-50"
                >
                  {isPending ? 'Публикация...' : 'Поделиться'}
                </button>
              </div>

              <div className="flex items-center gap-3 border-b border-[#dbdbdb] px-4 py-3">
                <UserAvatar
                  src={user?.avatar}
                  username={user?.username ?? 'user'}
                  size={28}
                />
                <span className="text-[14px] font-semibold text-black">
                  {user?.username}
                </span>
              </div>

              <div className="relative flex min-h-0 flex-1 flex-col">
                <div className="flex-1 overflow-y-auto px-4 py-3">
                  <textarea
                    ref={captionRef}
                    value={caption}
                    onChange={(event) =>
                      handleCaptionChange(event.target.value, event.target.selectionStart ?? 0)
                    }
                    onClick={(event) =>
                      setCaptionCursor(event.currentTarget.selectionStart ?? 0)
                    }
                    onKeyUp={(event) =>
                      setCaptionCursor(event.currentTarget.selectionStart ?? 0)
                    }
                    placeholder="Добавьте подпись..."
                    className="min-h-[120px] w-full resize-none text-[14px] outline-none placeholder:text-[#8e8e8e]"
                  />

                  {previews.length > 1 && (
                    <div className="mt-4 flex gap-2 overflow-x-auto">
                      {previews.map((preview, index) => (
                        <button
                          key={preview}
                          type="button"
                          onClick={() => setActivePreview(index)}
                          className={`h-14 w-14 shrink-0 overflow-hidden rounded border-2 ${
                            activePreview === index ? 'border-[#0095f6]' : 'border-transparent'
                          }`}
                        >
                          <img src={preview} alt="" className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <HashtagSuggestionsList
                  suggestions={hashtagSuggestions}
                  isLoading={isHashtagLoading}
                  onSelect={handleSelectHashtag}
                  className="max-h-[220px] border-t border-[#dbdbdb]"
                />
              </div>

              <div className="border-t border-[#dbdbdb]">
                {!showLocation ? (
                  <button
                    type="button"
                    onClick={() => setShowLocation(true)}
                    className="flex w-full items-center justify-between px-4 py-3 text-[14px] text-black hover:bg-[#fafafa]"
                  >
                    Добавить место
                    <MapPin className="h-4 w-4 text-[#8e8e8e]" />
                  </button>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-3">
                    <MapPin className="h-4 w-4 shrink-0 text-[#8e8e8e]" />
                    <input
                      value={location}
                      onChange={(event) => setLocation(event.target.value)}
                      placeholder="Место"
                      className="flex-1 text-[14px] outline-none placeholder:text-[#8e8e8e]"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-[#dbdbdb] px-4 py-2 text-[12px] text-[#8e8e8e]">
                <Smile className="h-5 w-5" />
                <span>
                  {caption.length}/{CAPTION_MAX.toLocaleString('ru-RU')}
                </span>
              </div>
            </div>
          </>
        )}

        {step === 'success' && (
          <>
            <div className="flex items-center justify-between border-b border-[#dbdbdb] px-4 py-4">
              <div className="w-10" />
              <h2 className="text-[16px] font-bold text-black">
                Вы поделились публикацией
              </h2>
              <button
                type="button"
                onClick={handleClose}
                className="text-[14px] font-semibold text-[#0095f6]"
              >
                Готово
              </button>
            </div>

            <div className="flex flex-col items-center px-8 py-16">
              <div className="mb-6 flex h-[88px] w-[88px] items-center justify-center rounded-full bg-gradient-to-tr from-[#feda75] via-[#fa7e1e] via-[#d62976] to-[#962fbf] p-[3px]">
                <div className="flex h-full w-full items-center justify-center rounded-full bg-white">
                  <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none">
                    <path
                      d="M5 13l4 4L19 7"
                      stroke="#0095f6"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-[14px] text-black">Публикация размещена.</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
