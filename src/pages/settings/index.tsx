// pages/settings/index.tsx

import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Search } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { AppLayout } from '@/widgets/app-layout/ui/AppLayout'
import { UserAvatar, ChangeAvatarModal, useUpdateProfile } from '@/entities/user'
import { AUTH_ME_QUERY_KEY, useMe } from '@/features/auth'

type SettingsSection = {
  title?: string
  items: string[]
}

const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    items: ['Центр аккаунтов', 'Личная информация', 'Пароль и безопасность', 'Рекламные предпочтения'],
  },
  {
    title: 'Как вы используете Instagram',
    items: ['Редактировать профиль', 'Уведомления'],
  },
  {
    title: 'Кто может видеть ваш контент',
    items: [
      'Конфиденциальность аккаунта',
      'Близкие друзья',
      'Заблокированные',
      'История и местоположение',
    ],
  },
  {
    title: 'Взаимодействие с вами',
    items: [
      'Сообщения и ответы на истории',
      'Метки и упоминания',
      'Комментарии',
      'Репосты и повторное использование',
      'Аккаунты с ограничениями',
      'Скрытые слова',
    ],
  },
  {
    title: 'Что вы видите',
    items: [
      'Скрытые аккаунты',
      'Настройки контента',
      'Число отметок "Нравится" и репостов',
      'Платные подписки на авторов',
    ],
  },
  {
    title: 'Ваше приложение и медиафайлы',
    items: ['Архивирование и скачивание', 'Специальные возможности', 'Язык', 'Разрешения сайта'],
  },
  {
    title: 'Семейный центр',
    items: ['Родительский контроль для аккаунтов подростков'],
  },
  {
    title: 'Для профессиональных аккаунтов',
    items: ['Тип аккаунта и инструменты', 'Подтвердите свой профиль'],
  },
  {
    title: 'Информация и поддержка',
    items: ['Помощь', 'Центр конфиденциальности', 'Статус аккаунта'],
  },
]

const GENDER_OPTIONS = [
  { value: '', label: 'Предпочитаю не указывать' },
  { value: 'male', label: 'Мужской' },
  { value: 'female', label: 'Женский' },
  { value: 'other', label: 'Другое' },
]

const FOOTER_LINKS = [
  'Meta',
  'Информация',
  'Блог',
  'Вакансии',
  'Помощь',
  'API',
  'Конфиденциальность',
  'Условия',
  'Места',
  'Популярное',
  'Instagram Lite',
  'Meta AI',
  'Threads',
  'Загрузка контактов и лиц, не являющиеся пользователями',
  'Meta Verified',
]

const inputClassName =
  'w-full rounded-lg border border-[#dbdbdb] bg-[#fafafa] px-3 py-2 text-[14px] outline-none focus:border-[#a8a8a8] focus:bg-white'

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const { data: user, isLoading } = useMe()
  const { mutate: updateProfile, isPending, isSuccess, error } = useUpdateProfile()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeItem, setActiveItem] = useState('Редактировать профиль')
  const [showAvatarModal, setShowAvatarModal] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [showRecommendations, setShowRecommendations] = useState(true)
  const [showAiBadge, setShowAiBadge] = useState(false)
  const [form, setForm] = useState({
    fullName: '',
    bio: '',
    website: '',
    gender: '',
  })

  useEffect(() => {
    if (searchParams.get('section') === 'edit-profile') {
      setActiveItem('Редактировать профиль')
    }
  }, [searchParams])

  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName ?? '',
        bio: user.bio ?? '',
        website: user.website ?? '',
        gender: user.gender ?? '',
      })
    }
  }, [user])

  const onChange =
    (key: keyof typeof form) =>
      (e: { target: { value: string } }) =>
        setForm((prev) => ({ ...prev, [key]: e.target.value }))

  // Универсальная функция обновления кеша и инвалидации
  const refreshUserData = () => {
    queryClient.invalidateQueries({ queryKey: AUTH_ME_QUERY_KEY })
    queryClient.invalidateQueries({ queryKey: ['user', user?.username] })
    queryClient.invalidateQueries({ queryKey: ['users', 'search'] })
    queryClient.invalidateQueries({ queryKey: ['suggestions'] })
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    updateProfile(
      {
        fullName: form.fullName.trim(),
        bio: form.bio,
        website: form.website.trim(),
        gender: form.gender,
      },
      {
        onSuccess: (updatedUser) => {
          // Если сервер вернул обновлённые данные, можно обновить кеш
          if (updatedUser) {
            queryClient.setQueryData(AUTH_ME_QUERY_KEY, updatedUser)
            queryClient.setQueryData(['user', user.username], updatedUser)
          }
          // Перезапрашиваем для гарантии
          refreshUserData()
        },
      }
    )
  }

  const handleAvatarUpdateSuccess = (updatedUser?: typeof user) => {
    if (updatedUser) {
      const normalizedUser = {
        ...updatedUser,
        avatar: updatedUser.avatar || undefined,
      }
      queryClient.setQueryData(AUTH_ME_QUERY_KEY, normalizedUser)
      queryClient.setQueryData(['user', user!.username], normalizedUser)
    }
    refreshUserData()
  }

  const onAvatarChange = (e: { target: { files: FileList | null; value: string } }) => {
    const file = e.target.files?.[0]
    if (!file) return

    setAvatarError(null)
    setShowAvatarModal(false)
    updateProfile(
      { avatar: file },
      {
        onSuccess: (updatedUser) => {
          handleAvatarUpdateSuccess(updatedUser)
        },
      }
    )

    e.target.value = ''
  }

  const handleOpenAvatarModal = () => {
    if (user?.avatar) {
      setShowAvatarModal(true)
      return
    }

    fileInputRef.current?.click()
  }

  const handleUploadAvatar = () => {
    setShowAvatarModal(false)
    fileInputRef.current?.click()
  }

  const handleDeleteAvatar = () => {
    setShowAvatarModal(false)
    setAvatarError(null)
    updateProfile(
      { removeAvatar: true },
      {
        onSuccess: (updatedUser) => {
          if (updatedUser?.avatar) {
            setAvatarError('Не удалось удалить фото. Обновите бэкенд на Railway.')
            return
          }
          handleAvatarUpdateSuccess(updatedUser)
        },
        onError: (deleteError) => {
          setAvatarError(deleteError.message)
        },
      }
    )
  }

  if (isLoading || !user) {
    return (
      <AppLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#dbdbdb] border-t-[#262626]" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-24px)] overflow-hidden">
        {/* Левая колонка — меню настроек */}
        <aside className="w-full max-w-[397px] shrink-0 overflow-y-auto border-r border-[#dbdbdb] px-4 py-8">
          <h1 className="mb-6 text-[24px] font-bold text-black">Настройки</h1>

          <div className="relative mb-6">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8e8e8e]"
              strokeWidth={2}
            />
            <input
              type="text"
              placeholder="Поисковый запрос"
              className="w-full rounded-lg bg-[#efefef] py-[10px] pl-10 pr-3 text-[16px] outline-none placeholder:text-[#8e8e8e]"
            />
          </div>

          {SETTINGS_SECTIONS.map((section, index) => (
            <div key={index} className="mb-6">
              {index === 0 ? (
                <div className="mb-4 rounded-lg border border-[#dbdbdb] p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-[16px] font-semibold text-[#0095f6]">∞ Meta</span>
                  </div>
                  <p className="mb-3 text-[14px] font-semibold text-black">Центр аккаунтов</p>
                  <p className="mb-2 text-[14px] text-[#737373]">
                    Управляйте настройками аккаунта и учитывайте, что для вас важнее всего в
                    продуктах Meta, например, в Instagram, Facebook и Meta Horizon.
                  </p>
                  {section.items.slice(1).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setActiveItem(item)}
                      className="block py-1 text-left text-[14px] text-[#0095f6] hover:underline"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  {section.title && (
                    <p className="mb-2 text-[16px] font-bold text-black">{section.title}</p>
                  )}
                  {section.items.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setActiveItem(item)}
                      className={`mb-1 block w-full rounded-lg px-3 py-2 text-left text-[14px] ${activeItem === item
                        ? 'bg-[#efefef] font-semibold text-black'
                        : 'text-black hover:bg-[#fafafa]'
                        }`}
                    >
                      {item}
                    </button>
                  ))}
                </>
              )}
            </div>
          ))}
        </aside>

        {/* Правая колонка — форма профиля */}
        <main className="flex-1 overflow-y-auto px-8 py-8 pb-24">
          <h2 className="mb-8 text-[24px] font-bold text-black">Редактировать профиль</h2>

          <div className="mb-8 flex items-center gap-6">
            <UserAvatar src={user.avatar} username={user.username} size={56} />
            <div className="min-w-0 flex-1">
              <p className="text-[16px] font-semibold text-black">{user.username}</p>
              <p className="text-[14px] text-[#737373]">{user.fullName}</p>
            </div>
            <button
              type="button"
              onClick={handleOpenAvatarModal}
              className="shrink-0 text-[14px] font-semibold text-[#0095f6] hover:underline"
            >
              Новое фото
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onAvatarChange}
            />
          </div>

          {avatarError && (
            <p className="mb-6 text-[14px] text-red-500">{avatarError}</p>
          )}

          <form onSubmit={onSubmit} className="max-w-[680px] space-y-6">
            <div>
              <label className="mb-2 block text-[16px] font-semibold text-black">Имя</label>
              <input
                type="text"
                placeholder="Имя и фамилия"
                value={form.fullName}
                onChange={onChange('fullName')}
                className={inputClassName}
              />
            </div>

            <div>
              <label className="mb-2 block text-[16px] font-semibold text-black">Сайт</label>
              <input
                type="text"
                placeholder="Сайт"
                value={form.website}
                onChange={onChange('website')}
                className={inputClassName}
              />
              <p className="mt-2 text-[12px] text-[#737373]">
                Изменить ссылки можно только в мобильной версии. Перейдите в приложение Instagram
                и коснитесь &quot;Редактировать профиль&quot;.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-[16px] font-semibold text-black">О себе</label>
              <div className="relative">
                <textarea
                  placeholder="О себе"
                  value={form.bio}
                  onChange={onChange('bio')}
                  maxLength={150}
                  rows={4}
                  className={`${inputClassName} resize-none`}
                />
                <span className="absolute bottom-2 right-3 text-[12px] text-[#8e8e8e]">
                  {form.bio.length} / 150
                </span>
              </div>
            </div>

            <div className="flex items-start justify-between gap-4 border-b border-[#dbdbdb] pb-6">
              <div>
                <p className="text-[16px] font-semibold text-black">Автор ИИ</p>
                <p className="mt-1 max-w-[520px] text-[14px] text-[#737373]">
                  Добавьте этот значок в профиль, если часто используете ИИ для создания контента.{' '}
                  <button type="button" className="text-[#0095f6] hover:underline">
                    Подробнее
                  </button>
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={showAiBadge}
                onClick={() => setShowAiBadge((v) => !v)}
                className={`relative h-7 w-11 shrink-0 rounded-full transition ${showAiBadge ? 'bg-black' : 'bg-[#dbdbdb]'
                  }`}
              >
                <span
                  className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${showAiBadge ? 'left-[18px]' : 'left-0.5'
                    }`}
                />
              </button>
            </div>

            <div>
              <label className="mb-2 block text-[16px] font-semibold text-black">Пол</label>
              <select
                value={form.gender}
                onChange={onChange('gender')}
                className={`${inputClassName} appearance-none`}
              >
                {GENDER_OPTIONS.map((option) => (
                  <option key={option.value || 'none'} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-[12px] text-[#737373]">
                Эта информация не будет показываться в вашем общедоступном профиле.
              </p>
            </div>

            <div className="rounded-lg border border-[#dbdbdb] p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[16px] font-semibold text-black">
                    Показывать рекомендации аккаунтов в профилях
                  </p>
                  <p className="mt-2 text-[14px] text-[#737373]">
                    Выберите, если хотите, чтобы люди могли видеть похожие рекомендуемые аккаунты в
                    вашем профиле, а ваш аккаунт можно было рекомендовать в других профилях.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={showRecommendations}
                  onClick={() => setShowRecommendations((v) => !v)}
                  className={`relative h-7 w-11 shrink-0 rounded-full transition ${showRecommendations ? 'bg-black' : 'bg-[#dbdbdb]'
                    }`}
                >
                  <span
                    className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${showRecommendations ? 'left-[18px]' : 'left-0.5'
                      }`}
                  />
                </button>
              </div>
            </div>

            <p className="text-[12px] text-[#737373]">
              Некоторые данные профиля, например, имя, био и ссылки, могут быть видны всем.{' '}
              <button type="button" className="text-[#0095f6] hover:underline">
                Посмотреть, какая информация профиля открыта
              </button>
            </p>

            {error && (
              <p className="text-[14px] text-red-500">{error.message}</p>
            )}
            {isSuccess && (
              <p className="text-[14px] text-green-600">Профиль успешно сохранён</p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-lg bg-[#abc1f5] py-2 text-[14px] font-semibold text-white transition enabled:bg-[#0095f6] enabled:hover:bg-[#0086e0] disabled:cursor-not-allowed"
            >
              {isPending ? 'Сохранение…' : 'Отправить'}
            </button>
          </form>

          <footer className="mt-16 border-t border-transparent pt-8">
            <nav className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
              {FOOTER_LINKS.map((link) => (
                <a key={link} href="#" className="text-[12px] text-[#8e8e8e] hover:underline">
                  {link}
                </a>
              ))}
            </nav>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 text-[12px] text-[#8e8e8e]">
              <span>Русский</span>
              <span>© 2024 Instagram from Meta</span>
            </div>
          </footer>
        </main>
      </div>

      <ChangeAvatarModal
        isOpen={showAvatarModal}
        hasAvatar={!!user.avatar}
        onClose={() => setShowAvatarModal(false)}
        onUpload={handleUploadAvatar}
        onDelete={handleDeleteAvatar}
      />
    </AppLayout>
  )
}