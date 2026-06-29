import { type MouseEvent } from 'react'
import { UserPlus } from 'lucide-react'
import { useMe } from '@/features/auth'
import { isUserFollowed } from '../lib/follow'
import { useFollowUser } from '../model/useFollowUser'

type FollowButtonProps = {
  userId: string
  size?: 'sm' | 'md'
  showIcon?: boolean
  className?: string
  onToggle?: () => void
}

export const FollowButton = ({
  userId,
  size = 'md',
  showIcon = false,
  className = '',
  onToggle,
}: FollowButtonProps) => {
  const { data: currentUser } = useMe()
  const { mutate: followUser, isPending } = useFollowUser()
  const isOwnAccount = currentUser?._id === userId
  const isFollowing = isUserFollowed(currentUser, userId)

  if (isOwnAccount) return null

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    if (isPending) return

    followUser(userId, {
      onSuccess: () => {
        onToggle?.()
      },
    })
  }

  const sizeClasses =
    size === 'sm' ? 'px-3 py-1 text-[12px]' : 'px-4 py-[7px] text-[14px]'

  if (isFollowing) {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={`shrink-0 rounded-lg bg-[#efefef] font-semibold text-black transition hover:bg-[#dbdbdb] disabled:opacity-60 ${sizeClasses} ${className}`}
      >
        Удалить
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={`shrink-0 rounded-lg bg-[#0095f6] font-semibold text-white transition hover:bg-[#1877f2] disabled:opacity-60 ${sizeClasses} ${className}`}
    >
      {showIcon ? (
        <span className="flex items-center gap-1">
          <UserPlus className="h-4 w-4" />
          Подписаться
        </span>
      ) : (
        'Подписаться'
      )}
    </button>
  )
}
