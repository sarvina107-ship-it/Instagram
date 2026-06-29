import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronDown, ChevronUp, Search, X } from 'lucide-react'
import { UserCard, userApi } from '@/entities/user'
import {
  PostDetailModal,
  PopularPostsGrid,
  usePopularPosts,
  postApi,
  HashtagSuggestionsList,
} from '@/entities/post'
import { AppLayout } from '@/widgets/app-layout/ui/AppLayout'
import { buildPath } from '@/shared/config/routes'
import { useDebounce } from '@/shared/hooks/useDebounce'

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
  'Загрузка контактов и лиц, не являющихся пользователями',
  'Meta Verified',
]

function SearchFooter() {
  return (
    <footer className="mt-auto px-4 pb-8 pt-10">
      <nav className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
        {FOOTER_LINKS.map((link) => (
          <a key={link} href="#" className="text-[12px] text-[#8e8e8e] hover:underline">
            {link}
          </a>
        ))}
      </nav>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[12px] text-[#8e8e8e]">
        <button type="button" className="flex items-center gap-1 hover:underline">
          Русский
          <ChevronDown className="h-3 w-3" />
        </button>
        <span>© 2024 Instagram from Meta</span>
      </div>
    </footer>
  )
}

export default function SearchPage() {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)
  const debouncedQuery = useDebounce(query.trim(), 400)

  const hasQuery = debouncedQuery.length > 0
  const isHashtagSearch = debouncedQuery.startsWith('#')
  const hashtagQuery = debouncedQuery.replace(/^#/, '')

  const {
    posts: popularPosts,
    isLoading: isPopularLoading,
    isFetchingNextPage,
    hasMore,
    fetchMore,
  } = usePopularPosts()

  const { data: users = [], isFetching: isUsersFetching } = useQuery({
    queryKey: ['users', 'search', debouncedQuery],
    queryFn: () => userApi.search(debouncedQuery),
    enabled: isSearchOpen && hasQuery && !isHashtagSearch,
  })

  const { data: hashtagResults = [], isFetching: isHashtagFetching } = useQuery({
    queryKey: ['hashtags', 'search', hashtagQuery],
    queryFn: () => postApi.searchHashtags(hashtagQuery),
    enabled: isSearchOpen && isHashtagSearch,
  })

  const activePost =
    viewerIndex !== null ? popularPosts[viewerIndex] : undefined

  useEffect(() => {
    if (isSearchOpen) {
      inputRef.current?.focus()
    }
  }, [isSearchOpen])

  const openSearch = () => setIsSearchOpen(true)

  const closeSearch = () => {
    setIsSearchOpen(false)
    setQuery('')
  }

  const clearQuery = () => {
    setQuery('')
    inputRef.current?.focus()
  }

  const handleUserClick = (username: string) => {
    navigate(buildPath.profile(username))
  }

  const handlePostClick = (_postId: string, index: number) => {
    setViewerIndex(index)
  }

  const handleHashtagClick = (tag: string) => {
    navigate(buildPath.hashtag(tag))
  }

  const popularGrid = (
    <PopularPostsGrid
      posts={popularPosts}
      isLoading={isPopularLoading}
      isFetchingNextPage={isFetchingNextPage}
      hasMore={hasMore}
      onFetchMore={() => void fetchMore()}
      onPostClick={handlePostClick}
    />
  )

  const postViewer =
    activePost && viewerIndex !== null ? (
      <PostDetailModal
        postId={activePost._id}
        onClose={() => setViewerIndex(null)}
        navigation={{
          currentIndex: viewerIndex,
          totalCount: popularPosts.length,
          onPrev: () => setViewerIndex((index) => Math.max(0, (index ?? 0) - 1)),
          onNext: () =>
            setViewerIndex((index) =>
              Math.min(popularPosts.length - 1, (index ?? 0) + 1)
            ),
        }}
      />
    ) : null

  if (!isSearchOpen) {
    return (
      <AppLayout>
        <div className="mx-auto w-full max-w-[935px] px-4 py-6 pb-24">
          <div className="mb-6 flex justify-center">
            <button
              type="button"
              onClick={openSearch}
              className="flex w-full max-w-[268px] items-center gap-3 rounded-lg bg-[#efefef] px-4 py-[10px] text-left transition hover:bg-[#e8e8e8]"
            >
              <Search className="h-4 w-4 text-[#8e8e8e]" strokeWidth={2} />
              <span className="text-[16px] text-[#8e8e8e]">Поиск</span>
            </button>
          </div>

          {popularGrid}
        </div>

        {postViewer}
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="mx-auto flex min-h-[calc(100vh-56px)] w-full max-w-[935px] flex-col px-4 py-6 pb-24">
        <div className="mb-4 flex items-center gap-3">
          <button
            type="button"
            onClick={closeSearch}
            className="flex h-8 w-8 shrink-0 items-center justify-center"
            aria-label="Назад"
          >
            <ChevronLeft className="h-6 w-6" strokeWidth={1.5} />
          </button>

          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8e8e8e]"
              strokeWidth={2}
            />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск"
              className="w-full rounded-lg bg-[#efefef] py-[10px] pl-10 pr-10 text-[16px] outline-none placeholder:text-[#8e8e8e]"
            />
            {query && (
              <button
                type="button"
                onClick={clearQuery}
                className="absolute right-3 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center rounded-full bg-[#8e8e8e] text-white"
                aria-label="Очистить"
              >
                <X className="h-3 w-3" strokeWidth={2} />
              </button>
            )}
          </div>
        </div>

        {isHashtagSearch ? (
          <div className="flex-1">
            <HashtagSuggestionsList
              suggestions={hashtagResults}
              isLoading={isHashtagFetching}
              onSelect={handleHashtagClick}
            />

            {!isHashtagFetching && hashtagResults.length === 0 && (
              <p className="py-8 text-center text-[14px] text-[#8e8e8e]">
                Хэштеги не найдены.
              </p>
            )}
          </div>
        ) : hasQuery ? (
          <div className="flex-1">
            {isUsersFetching && (
              <p className="py-8 text-center text-[14px] text-[#8e8e8e]">Поиск…</p>
            )}

            {!isUsersFetching && users.length === 0 && (
              <p className="py-8 text-center text-[14px] text-[#8e8e8e]">
                Результаты не найдены.
              </p>
            )}

            {!isUsersFetching &&
              users.map((user) => (
                <UserCard
                  key={user._id}
                  user={user}
                  onClick={() => handleUserClick(user.username)}
                />
              ))}
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-black">Популярное</h2>
              <div className="flex items-center gap-2 text-[#262626]">
                <button type="button" aria-label="Вверх">
                  <ChevronUp className="h-4 w-4" strokeWidth={2} />
                </button>
                <button type="button" aria-label="Вниз">
                  <ChevronDown className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>
            </div>

            {popularGrid}
          </>
        )}

        <SearchFooter />
      </div>

      {postViewer}
    </AppLayout>
  )
}
