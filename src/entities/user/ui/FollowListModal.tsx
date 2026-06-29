import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, X } from 'lucide-react'
import { useMe } from '@/features/auth'
import { userApi } from '../api/userApi'
import { FollowButton } from '../ui/FollowButton'
import type { User } from '../model/types'
import { UserAvatar } from './UserAvatar'
import { buildPath } from '@/shared/config/routes'

type FollowListType = 'followers' | 'following'

type FollowListModalProps = {
  isOpen: boolean
  onClose: () => void
  userId: string
  username: string
  listType: FollowListType
  isOwnProfile: boolean
}

function UserListRow({
  user,
  onFollowChange,
  onNavigate,
}: {
  user: User
  onFollowChange: () => void
  onNavigate: (username: string) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <button
        type="button"
        onClick={() => onNavigate(user.username)}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <UserAvatar src={user.avatar} username={user.username} size={44} />
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold text-black">{user.username}</p>
          <p className="truncate text-[14px] text-[#8e8e8e]">{user.fullName}</p>
        </div>
      </button>
      <FollowButton userId={user._id} onToggle={onFollowChange} />
    </div>
  )
}

export const FollowListModal = ({
  isOpen,
  onClose,
  userId,
  username,
  listType,
  isOwnProfile,
}: FollowListModalProps) => {
  const navigate = useNavigate()
  const { data: currentUser } = useMe()
  const [searchQuery, setSearchQuery] = useState('')

  const listQueryKey = listType === 'followers' ? 'followers' : 'following'

  const {
    data: users = [],
    isLoading,
    refetch: refetchList,
  } = useQuery({
    queryKey: [listQueryKey, userId],
    queryFn: () =>
      listType === 'followers'
        ? userApi.getFollowers(userId)
        : userApi.getFollowing(userId),
    enabled: isOpen && !!userId,
  })

  const { data: suggestions = [] } = useQuery({
    queryKey: ['suggestions'],
    queryFn: () => userApi.getSuggestions(),
    enabled: isOpen,
  })

  const title =
    listType === 'followers'
      ? isOwnProfile
        ? 'Подписчики'
        : `Подписчики: ${username}`
      : isOwnProfile
        ? 'Подписки'
        : `Подписки: ${username}`

  const normalizedUsers = useMemo(
    () => (Array.isArray(users) ? users : []),
    [users]
  )

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return normalizedUsers

    return normalizedUsers.filter(
      (user) =>
        user.username.toLowerCase().includes(query) ||
        user.fullName?.toLowerCase().includes(query)
    )
  }, [normalizedUsers, searchQuery])

  const recommendationUsers = useMemo(() => {
    const listedIds = new Set(normalizedUsers.map((user) => user._id))
    if (currentUser?._id) listedIds.add(currentUser._id)

    return suggestions.filter((user) => !listedIds.has(user._id))
  }, [currentUser?._id, normalizedUsers, suggestions])

  const filteredRecommendations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return recommendationUsers

    return recommendationUsers.filter(
      (user) =>
        user.username.toLowerCase().includes(query) ||
        user.fullName?.toLowerCase().includes(query)
    )
  }, [recommendationUsers, searchQuery])

  const handleNavigate = (targetUsername: string) => {
    onClose()
    navigate(buildPath.profile(targetUsername))
  }

  const handleFollowChange = () => {
    void refetchList()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[min(560px,90vh)] w-full max-w-[400px] flex-col overflow-hidden rounded-xl bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative border-b border-[#dbdbdb] px-4 py-4">
          <h2 className="text-center text-[16px] font-bold text-black">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#262626]"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-[#dbdbdb] px-4 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8e8e8e]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Поиск"
              className="w-full rounded-lg bg-[#efefef] py-2 pl-10 pr-3 text-[16px] outline-none placeholder:text-[#8e8e8e]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="py-10 text-center text-[14px] text-[#8e8e8e]">Загрузка...</div>
          ) : (
            <>
              {filteredUsers.length === 0 && filteredRecommendations.length === 0 ? (
                <div className="py-10 text-center text-[14px] text-[#8e8e8e]">
                  {searchQuery ? 'Ничего не найдено' : 'Список пуст'}
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <UserListRow
                    key={user._id}
                    user={user}
                    onFollowChange={handleFollowChange}
                    onNavigate={handleNavigate}
                  />
                ))
              )}

              {filteredRecommendations.length > 0 && (
                <>
                  <div className="px-4 pb-2 pt-4">
                    <p className="text-[14px] font-bold text-black">Рекомендации для вас</p>
                  </div>
                  {filteredRecommendations.map((user) => (
                    <UserListRow
                      key={`suggestion-${user._id}`}
                      user={user}
                      onFollowChange={handleFollowChange}
                      onNavigate={handleNavigate}
                    />
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
