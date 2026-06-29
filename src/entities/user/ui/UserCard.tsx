import { UserAvatar } from './UserAvatar'
import type { User } from '../model/types'

interface UserCardProps {
  user: User
  onClick?: () => void
}

export const UserCard = ({ user, onClick }: UserCardProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-2 text-left transition hover:bg-[#fafafa]"
    >
      <UserAvatar src={user.avatar} username={user.username} />
      <span className="min-w-0">
        <span className="block truncate text-[14px] font-semibold text-black">
          {user.username}
        </span>
        <span className="block truncate text-[14px] text-[#8e8e8e]">{user.fullName}</span>
      </span>
    </button>
  )
}
