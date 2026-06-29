import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Plus, X } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useCreateStory } from '../model/useCreateStory'

type CreateStoryModalProps = {
  isOpen: boolean
  onClose: () => void
}

type Step = 'name' | 'files' | 'success'

export const CreateStoryModal = ({ isOpen, onClose }: CreateStoryModalProps) => {
  const queryClient = useQueryClient()
  const { mutateAsync: createStory, isPending } = useCreateStory()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>('name')
  const [title, setTitle] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)

  const canSubmitTitle = title.trim().length > 0
  const canUpload = files.length > 0 && !isPending

  const reset = () => {
    previews.forEach((u) => URL.revokeObjectURL(u))
    setTitle('')
    setFiles([])
    setPreviews([])
    setStep('name')
    setError(null)
    setProgress(null)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const addFiles = (selected: FileList | File[]) => {
    const next = Array.from(selected)
    if (!next.length) return
    const max = 20
    const merged = [...files, ...next].slice(0, max)

    // rebuild previews for merged list
    previews.forEach((u) => URL.revokeObjectURL(u))
    const nextPreviews = merged.map((f) => URL.createObjectURL(f))
    setFiles(merged)
    setPreviews(nextPreviews)
  }

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) addFiles(event.target.files)
    event.target.value = ''
  }

  const removeAt = (idx: number) => {
    const nextFiles = files.filter((_, i) => i !== idx)
    previews.forEach((u) => URL.revokeObjectURL(u))
    const nextPreviews = nextFiles.map((f) => URL.createObjectURL(f))
    setFiles(nextFiles)
    setPreviews(nextPreviews)
  }

  const handleNext = () => {
    setError(null)
    if (!canSubmitTitle) return
    setStep('files')
  }

  const handlePickFiles = () => fileInputRef.current?.click()

  const handleSubmit = async () => {
    if (!canUpload) return
    setError(null)
    setProgress({ done: 0, total: files.length })

    try {
      for (let i = 0; i < files.length; i += 1) {
        // создаём сторис по одному файлу — так выполняем “мультизагрузку”
        await createStory({ caption: title.trim(), media: files[i]! })
        setProgress({ done: i + 1, total: files.length })
      }

      await queryClient.invalidateQueries({ queryKey: ['stories'] })
      setStep('success')
    } catch {
      setError('Не удалось загрузить сторис. Проверь сервер и формат медиа.')
      setProgress(null)
    }
  }

  const previewItems = useMemo(
    () =>
      previews.map((url, i) => ({
        url,
        type: files[i]?.type.startsWith('video') ? 'video' : 'image',
        name: files[i]?.name ?? '',
      })),
    [files, previews]
  )

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[210] flex items-center justify-center bg-black/65 p-4"
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
        className="w-full max-w-[540px] overflow-hidden rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {step === 'name' && (
          <>
            <div className="border-b border-[#dbdbdb] px-4 py-4">
              <h2 className="text-center text-[16px] font-bold text-black">
                Создание актуального
              </h2>
            </div>

            <div className="px-6 py-8">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Название актуального"
                className="w-full rounded-lg border border-[#dbdbdb] px-4 py-3 text-[14px] outline-none focus:border-[#a8a8a8]"
              />

              <button
                type="button"
                onClick={handleNext}
                disabled={!canSubmitTitle}
                className="mt-4 w-full rounded-lg bg-[#efefef] px-4 py-[10px] text-[14px] font-semibold text-black disabled:opacity-50"
              >
                Далее
              </button>
            </div>
          </>
        )}

        {step === 'files' && (
          <>
            <div className="flex items-center justify-between border-b border-[#dbdbdb] px-4 py-4">
              <h2 className="text-[16px] font-bold text-black">Загрузка сторис</h2>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canUpload}
                className="text-[14px] font-semibold text-[#0095f6] disabled:opacity-50"
              >
                {isPending ? 'Загрузка...' : 'Подтвердить'}
              </button>
            </div>

            <div className="px-6 py-6">
              <div className="flex items-center justify-between">
                <div className="text-[14px] text-black">
                  Название: <span className="font-semibold">{title.trim()}</span>
                </div>
                <button
                  type="button"
                  onClick={handlePickFiles}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#efefef] px-3 py-2 text-[14px] font-semibold text-black hover:bg-[#e4e4e4]"
                >
                  <Plus className="h-4 w-4" />
                  Добавить ещё
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={onInputChange}
              />

              {previewItems.length === 0 ? (
                <div className="mt-8 rounded-lg border border-dashed border-[#dbdbdb] px-6 py-10 text-center">
                  <p className="text-[14px] text-[#737373]">
                    Выберите фото или видео для сторис
                  </p>
                  <button
                    type="button"
                    onClick={handlePickFiles}
                    className="mt-4 rounded-lg bg-[#0095f6] px-4 py-[7px] text-[14px] font-semibold text-white hover:bg-[#1877f2]"
                  >
                    Выбрать файлы
                  </button>
                </div>
              ) : (
                <div className="mt-5 grid grid-cols-3 gap-2">
                  {previewItems.map((p, i) => (
                    <div key={`${p.url}-${i}`} className="relative overflow-hidden rounded-lg">
                      {p.type === 'video' ? (
                        <video src={p.url} className="h-28 w-full object-cover" />
                      ) : (
                        <img src={p.url} alt="" className="h-28 w-full object-cover" />
                      )}
                      <button
                        type="button"
                        onClick={() => removeAt(i)}
                        className="absolute right-1 top-1 rounded bg-black/60 px-2 py-1 text-[12px] text-white"
                        aria-label="Удалить"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {progress && (
                <div className="mt-4 text-[12px] text-[#737373]">
                  Загружено: {progress.done}/{progress.total}
                </div>
              )}

              {error && <div className="mt-4 text-[12px] text-red-600">{error}</div>}
            </div>
          </>
        )}

        {step === 'success' && (
          <>
            <div className="border-b border-[#dbdbdb] px-4 py-4">
              <h2 className="text-center text-[16px] font-bold text-black">Готово</h2>
            </div>
            <div className="px-6 py-10 text-center">
              <p className="text-[14px] text-black">Сторис добавлены.</p>
              <button
                type="button"
                onClick={handleClose}
                className="mt-6 rounded-lg bg-[#0095f6] px-4 py-[7px] text-[14px] font-semibold text-white hover:bg-[#1877f2]"
              >
                Закрыть
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

