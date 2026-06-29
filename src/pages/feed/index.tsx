import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { AppLayout } from '@/widgets/app-layout/ui/AppLayout'
import { useMe } from '@/features/auth'
import { userApi, UserAvatar, FollowButton } from '@/entities/user'
import {
  FeedPostCard,
  FeedStories,
  useFeedPosts,
} from '@/entities/post'
import { buildPath } from '@/shared/config/routes'

const FOOTER_LINKS = [
  'Информация',
  'Помощь',
  'Пресса',
  'API',
  'Вакансии',
  'Конфиденциальность',
  'Условия',
  'Места',
  'Язык',
  'Meta Verified',
]

export default function FeedPage() {
  const navigate = useNavigate()
  const { data: user } = useMe()
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const {
    followingPosts,
    recommendedPosts,
    isLoading,
    isFetchingNextPage,
    hasMoreFollowing,
    fetchMoreFollowing,
  } = useFeedPosts()

  const { data: suggestions = [], isLoading: isSuggestionsLoading } = useQuery({
    queryKey: ['suggestions'],
    queryFn: () => userApi.getSuggestions(),
    select: (data) => data.slice(0, 6),
  })

  useEffect(() => {
    const element = loadMoreRef.current
    if (!element || !hasMoreFollowing) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) {
          void fetchMoreFollowing()
        }
      },
      { rootMargin: '200px' }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [fetchMoreFollowing, hasMoreFollowing, isFetchingNextPage])

  const handleUserClick = (username: string) => {
    navigate(buildPath.profile(username))
  }

  return (
    <AppLayout>
      <div className="mx-auto flex max-w-[1280px] justify-center gap-8 px-4 py-7">
        <main className="w-full max-w-[470px]">
          <FeedStories />

          {isLoading && (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#dbdbdb] border-t-[#262626]" />
            </div>
          )}

          {!isLoading && followingPosts.length === 0 && recommendedPosts.length === 0 && (
            <div className="rounded-xl border border-[#dbdbdb] bg-white px-6 py-16 text-center">
              <p className="mb-2 text-[16px] font-semibold text-black">
                Добро пожаловать в ленту
              </p>
              <p className="text-[14px] text-[#8e8e8e]">
                Подпишитесь на пользователей или создайте первую публикацию.
              </p>
            </div>
          )}

          {followingPosts.map((post) => (
            <FeedPostCard key={post._id} post={post} />
          ))}

          {hasMoreFollowing && (
            <div ref={loadMoreRef} className="flex justify-center py-6">
              {isFetchingNextPage && (
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#dbdbdb] border-t-[#262626]" />
              )}
            </div>
          )}

          {!hasMoreFollowing && recommendedPosts.length > 0 && followingPosts.length > 0 && (
            <p className="py-4 text-center text-[12px] font-semibold uppercase tracking-wide text-[#8e8e8e]">
              Рекомендации для вас
            </p>
          )}

          {recommendedPosts.map((post) => (
            <FeedPostCard key={post._id} post={post} isRecommended />
          ))}
        </main>

        <aside className="hidden w-[320px] shrink-0 lg:block">
          <div className="sticky top-7">
            {user && (
              <div
                className="mb-6 flex cursor-pointer items-center justify-between"
                onClick={() => handleUserClick(user.username)}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <UserAvatar src={user.avatar} username={user.username} size={44} />
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold text-black">
                      {user.username}
                    </p>
                    <p className="truncate text-[14px] text-[#8e8e8e]">
                      {user.fullName}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="text-[12px] font-semibold text-[#0095f6]"
                  onClick={(event) => {
                    event.stopPropagation()
                    navigate(buildPath.settings())
                  }}
                >
                  Сменить
                </button>
              </div>
            )}

            <div className="mb-3 flex items-center justify-between">
              <span className="text-[14px] font-semibold text-[#8e8e8e]">
                Рекомендации для вас
              </span>
            </div>

            <div className="space-y-3">
              {isSuggestionsLoading && (
                <div className="py-4 text-center text-[14px] text-[#8e8e8e]">
                  Загрузка...
                </div>
              )}

              {!isSuggestionsLoading &&
                suggestions.map((suggestedUser) => (
                  <div
                    key={suggestedUser._id}
                    className="flex cursor-pointer items-center justify-between"
                    onClick={() => handleUserClick(suggestedUser.username)}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <UserAvatar
                        src={suggestedUser.avatar}
                        username={suggestedUser.username}
                        size={32}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-semibold text-black">
                          {suggestedUser.username}
                        </p>
                        <p className="truncate text-[12px] text-[#8e8e8e]">
                          {suggestedUser.fullName || 'Рекомендации для вас'}
                        </p>
                      </div>
                    </div>
                    <FollowButton userId={suggestedUser._id} size="sm" />
                  </div>
                ))}
            </div>

            <p className="mt-8 text-[11px] leading-relaxed text-[#c7c7c7]">
              {FOOTER_LINKS.map((link, index) => (
                <span key={link}>
                  <a href="#" className="hover:underline">
                    {link}
                  </a>
                  {index < FOOTER_LINKS.length - 1 && ' · '}
                </span>
              ))}
            </p>

            <p className="mt-4 text-[11px] uppercase text-[#c7c7c7]">
              © 2026 Instagram from Meta
            </p>
          </div>
        </aside>
      </div>
    </AppLayout>
  )
}
