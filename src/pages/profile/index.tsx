import { useMemo, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Bookmark,
  Grid3X3,
  Settings,
  SquareUser,
  ArrowLeft,
} from 'lucide-react'
import { AppLayout } from '@/widgets/app-layout/ui/AppLayout'
import { useMe } from '@/features/auth'
import {
  userApi,
  UserAvatar,
  FollowListModal,
  FollowButton,
  getFollowListCount,
} from '@/entities/user'
import {
  CreateStoryModal,
  ProfilePostsSection,
  StoryViewerModal,
  usePostModal,
  useUserStories,
  filterValidStories,
  type StoryGroup,
} from '@/entities/post'
import { buildPath } from '@/shared/config/routes'
import { resolveMediaUrl } from '@/shared/lib/mediaUrl'

type ProfileTab = 'posts' | 'saved' | 'tagged'
type FollowModalType = 'followers' | 'following' | null
const PROFILE_FOOTER_LINKS = [
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
  'Загрузка контактов и лиц, не являющихся пользователями',
  'Meta Verified',
]

const TABS: { id: ProfileTab; label: string; icon: LucideIcon }[] = [
  { id: 'posts', label: 'Публикации', icon: Grid3X3 },
  { id: 'saved', label: 'Сохранённое', icon: Bookmark },
  { id: 'tagged', label: 'Отметки', icon: SquareUser },
]

function ProfileFooter() {
  return (
    <footer className="mt-auto border-t border-transparent pt-10">
      <nav className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
        {PROFILE_FOOTER_LINKS.map((link) => (
          <a key={link} href="#" className="text-[12px] text-[#8e8e8e] hover:underline">
            {link}
          </a>
        ))}
      </nav>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[12px] text-[#8e8e8e]">
        <button type="button" className="flex items-center gap-1 hover:underline">
          Русский
          <svg aria-hidden="true" className="h-2 w-2" viewBox="0 0 12 12" fill="currentColor">
            <path d="M6 8.5L1.5 4h9L6 8.5z" />
          </svg>
        </button>
        <span>© 2026 Instagram from Meta</span>
      </div>
    </footer>
  )
}

function TabContent({
  tab,
  isOwnProfile,
  userId,
  onPostClick,
  onCreateClick,
}: {
  tab: ProfileTab
  isOwnProfile: boolean
  userId: string
  onPostClick: (postId: string) => void
  onCreateClick: () => void
}) {
  if (tab === 'posts') {
    return (
      <ProfilePostsSection
        userId={userId}
        isOwnProfile={isOwnProfile}
        onPostClick={onPostClick}
        onCreateClick={onCreateClick}
      />
    )
  }

  if (tab === 'saved') {
    if (!isOwnProfile) {
      return (
        <div className="flex flex-col items-center px-4 pb-10 pt-24 text-center">
          <div className="mb-6 flex h-[62px] w-[62px] items-center justify-center rounded-full border border-black">
            <Bookmark className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <h2 className="mb-3 text-[28px] font-light text-black">Сохранённое</h2>
          <p className="max-w-[360px] text-[14px] text-[#737373]">
            Сохранённые элементы доступны только владельцу аккаунта.
          </p>
        </div>
      )
    }

    return (
      <>
        <div className="flex items-center justify-between px-1 py-3">
          <span className="text-[14px] text-[#737373]">
            Список сохраненного виден только вам
          </span>
          <button type="button" className="text-[14px] font-semibold text-[#0095f6]">
            + Новая подборка
          </button>
        </div>

        <div className="flex flex-col items-center px-4 pb-10 pt-20 text-center">
          <div className="mb-6 flex h-[62px] w-[62px] items-center justify-center rounded-full border border-black">
            <Bookmark className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <h2 className="mb-4 text-[24px] font-bold text-black">Сохранить</h2>
          <p className="max-w-[400px] text-[14px] leading-[1.5] text-[#737373]">
            Сохраняйте фото и видео, которые хотите посмотреть снова. Никто не получит
            уведомления об этом, а сохраненные объекты сможете видеть только вы.
          </p>
        </div>
      </>
    )
  }

  if (tab === 'tagged') {
    return (
      <div className="flex flex-col items-center px-4 pb-10 pt-24 text-center">
        <div className="mb-6 flex h-[62px] w-[62px] items-center justify-center rounded-full border border-black">
          <SquareUser className="h-6 w-6" strokeWidth={1.5} />
        </div>
        <h2 className="mb-3 text-[28px] font-light text-black">
          {isOwnProfile ? 'Фото с вами' : 'Фото с пользователем'}
        </h2>
        <p className="max-w-[360px] text-[14px] text-[#737373]">
          {isOwnProfile
            ? 'Здесь показываются люди, отметившие вас на фото.'
            : 'Здесь показываются фото, где был отмечен этот пользователь.'}
        </p>
      </div>
    )
  }

  return null
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const { username: routeUsername } = useParams()
  const { data: currentUser, isLoading: isCurrentUserLoading } = useMe()
  const { openCreatePost, openPostDetail } = usePostModal()
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts')
  const [followModalType, setFollowModalType] = useState<FollowModalType>(null)
  const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false)
  const [storyViewerOpen, setStoryViewerOpen] = useState(false)
  const [selectedStoryGroupIndex, setSelectedStoryGroupIndex] = useState(0)
  const isOwnProfile = !routeUsername || routeUsername === currentUser?.username
  const targetUsername = isOwnProfile ? currentUser?.username : routeUsername

  const {
    data: profileUser,
    isLoading: isProfileLoading,
    isError,
  } = useQuery({
    queryKey: ['user', targetUsername],
    queryFn: () => userApi.getByUsername(targetUsername!),
    enabled: !!targetUsername && !isCurrentUserLoading,
  })

  const isLoading = isCurrentUserLoading || isProfileLoading

  const handleBack = () => {    navigate(-1)
  }

  // IMPORTANT: hooks must be called unconditionally on every render
  const profileUserId = profileUser?._id
  const profileUsername = profileUser?.username
  const profileAvatar = profileUser?.avatar
  const profileFullName = profileUser?.fullName

  const { data: userStories = [] } = useUserStories(profileUserId, !!profileUserId)

  const storyGroups = useMemo<StoryGroup[]>(() => {
    if (!profileUserId || !profileUsername) return []

    const map = new Map<string, typeof userStories>()
    userStories.forEach((story) => {
      const caption = (story.caption ?? '').trim() || 'Актуальное'
      const list = map.get(caption)
      if (list) list.push(story)
      else map.set(caption, [story])
    })

    return Array.from(map.entries())
      .map(([caption, stories]) => ({
        author: {
          _id: profileUserId,
          username: profileUsername,
          avatar: profileAvatar,
          fullName: profileFullName,
        },
        stories: filterValidStories(stories),
        hasUnseen: stories.some((s) => !s.seen),
      }))
      .filter((group) => group.stories.length > 0)
  }, [profileAvatar, profileFullName, profileUserId, profileUsername, userStories])

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#dbdbdb] border-t-[#262626]" />
        </div>
      </AppLayout>
    )
  }

  if (isError || !profileUser) {
    return (
      <AppLayout>
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
          <div className="text-[14px] text-[#737373]">Пользователь не найден</div>
          <button
            onClick={() => navigate(buildPath.feed())}
            className="rounded-lg bg-[#0095f6] px-4 py-2 text-sm font-semibold text-white"
          >
            На главную
          </button>
        </div>
      </AppLayout>
    )
  }

  const avatarSrc =
    isOwnProfile && currentUser?.avatar ? currentUser.avatar : profileUser.avatar

  const followersCount = getFollowListCount(profileUser.followers)
  const followingCount = getFollowListCount(profileUser.following)
  const postsCount = profileUser.postCount ?? profileUser.posts?.length ?? 0

  return (
    <AppLayout>
      <div className="mx-auto flex min-h-[calc(100vh-56px)] w-full max-w-[935px] flex-col px-4 py-9 pb-24">
        {!isOwnProfile && (
          <button
            onClick={handleBack}
            className="mb-4 flex items-center gap-2 text-[#262626] hover:text-black"
            aria-label="Назад"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
            <span className="text-sm">Назад</span>
          </button>
        )}

        <header className="mb-10 flex flex-col gap-8 sm:flex-row sm:items-start sm:gap-10 md:gap-16">
          <div className="relative mx-auto shrink-0 sm:mx-0">
            {isOwnProfile && (
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-[14px] border border-[#dbdbdb] bg-white px-3 py-1.5 text-[12px] text-[#262626] shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
                Заметка...
              </div>
            )}
            <UserAvatar
              src={avatarSrc}
              username={profileUser.username}
              size={150}
              className="border-2 border-white"
            />
          </div>

          <div className="min-w-0 flex-1 pt-1">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-4">
              <h1 className="text-[20px] font-normal leading-none text-black">
                {profileUser.username}
              </h1>
              {isOwnProfile ? (
                <button
                  type="button"
                  aria-label="Настройки"
                  onClick={() => navigate(buildPath.settings())}
                >
                  <Settings className="h-6 w-6" strokeWidth={1.5} />
                </button>
              ) : (
                <FollowButton userId={profileUser._id} showIcon />
              )}            </div>

            <p className="mb-5 text-[14px] font-semibold leading-none text-black">
              {profileUser.fullName}
            </p>

            {profileUser.bio && (
              <p className="mb-5 text-[14px] leading-snug text-[#262626]">{profileUser.bio}</p>
            )}

            <div className="mb-5 flex gap-10 text-[16px] leading-none">
              <span>
                <span className="font-semibold">{postsCount}</span> публикаций
              </span>
              <button
                type="button"
                className="hover:underline"
                onClick={() => setFollowModalType('followers')}
              >
                <span className="font-semibold">{followersCount}</span> подписчиков
              </button>
              <button
                type="button"
                className="hover:underline"
                onClick={() => setFollowModalType('following')}
              >
                <span className="font-semibold">{followingCount}</span> подписка
              </button>
            </div>
            {isOwnProfile && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => navigate(buildPath.settingsEditProfile())}
                  className="rounded-lg bg-[#efefef] px-4 py-[7px] text-[14px] font-semibold text-black hover:bg-[#e4e4e4] transition"
                >
                  Редактировать профиль
                </button>
                <button
                  type="button"
                  className="rounded-lg bg-[#efefef] px-4 py-[7px] text-[14px] font-semibold text-black hover:bg-[#e4e4e4] transition"
                >
                  Посмотреть архив
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="mb-12 flex gap-7 overflow-x-auto">
          {isOwnProfile && (
            <button
              type="button"
              onClick={() => setIsCreateStoryOpen(true)}
              className="flex shrink-0 flex-col items-center gap-2"
            >
              <div className="flex h-[77px] w-[77px] items-center justify-center rounded-full border border-[#dbdbdb] bg-white">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M12 5v14M5 12h14"
                    stroke="#262626"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <span className="text-[12px] text-black">Добавить</span>
            </button>
          )}

          {storyGroups.map((group, groupIndex) => {
            const cover = resolveMediaUrl(group.stories[0]?.media?.url)
            const ringClass = group.hasUnseen
              ? 'bg-gradient-to-tr from-[#feda75] via-[#fa7e1e] via-[#d62976] to-[#962fbf]'
              : 'bg-[#dbdbdb]'

            return (
              <button
                key={`${group.author._id}-${group.stories[0]?._id ?? 'group'}`}
                type="button"
                onClick={() => {
                  setSelectedStoryGroupIndex(groupIndex)
                  setStoryViewerOpen(true)
                }}
                className="flex shrink-0 flex-col items-center gap-2"
              >
                <div className={`rounded-full p-[2px] ${ringClass}`}>
                  <div className="h-[77px] w-[77px] overflow-hidden rounded-full bg-white p-[2px]">
                    {cover ? (
                      <img src={cover} alt="" className="h-full w-full rounded-full object-cover" />
                    ) : (
                      <div className="h-full w-full rounded-full bg-[#efefef]" />
                    )}
                  </div>
                </div>
                <span className="max-w-[84px] truncate text-[12px] text-black">
                  {(group.stories[0]?.caption ?? '').trim() || 'Актуальное'}
                </span>
              </button>
            )
          })}
        </div>

        <div className="border-t border-[#dbdbdb]">
          <div className="flex justify-center gap-[60px]">
            {(isOwnProfile ? TABS : TABS.filter(tab => tab.id !== 'saved')).map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  aria-label={label}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative -mt-px flex items-center justify-center px-1 py-[14px] transition ${isActive
                    ? 'border-t border-black text-black'
                    : 'border-t border-transparent text-[#8e8e8e]'
                    }`}
                >
                  <Icon className="h-3 w-3" strokeWidth={1.5} />
                </button>
              )
            })}
          </div>
        </div>

        <TabContent
          tab={activeTab}
          isOwnProfile={isOwnProfile}
          userId={profileUser._id}
          onPostClick={openPostDetail}
          onCreateClick={openCreatePost}
        />

        <ProfileFooter />
      </div>

      {followModalType && (
        <FollowListModal
          isOpen
          onClose={() => setFollowModalType(null)}
          userId={profileUser._id}
          username={profileUser.username}
          listType={followModalType}
          isOwnProfile={isOwnProfile}
        />
      )}

      <CreateStoryModal
        isOpen={isCreateStoryOpen}
        onClose={() => setIsCreateStoryOpen(false)}
      />

      {storyGroups.length > 0 && (
        <StoryViewerModal
          isOpen={storyViewerOpen}
          onClose={() => setStoryViewerOpen(false)}
          groups={storyGroups}
          initialGroupIndex={selectedStoryGroupIndex}
        />
      )}
    </AppLayout>  )
}