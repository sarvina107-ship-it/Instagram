// entities/user/ui/UserAvatar.tsx

import { useEffect, useState } from 'react'
import { resolveMediaUrl } from '@/shared/lib/mediaUrl'

interface UserAvatarProps {
  src?: string | null
  username: string
  size?: number
  className?: string
}

export const UserAvatar = ({
  src,
  username,
  size = 44,
  className = '',
}: UserAvatarProps) => {
  const [hasError, setHasError] = useState(false)
  const style = { width: size, height: size }
  const fullSrc = resolveMediaUrl(src)

  useEffect(() => {
    setHasError(false)
  }, [src])

  const showImage = fullSrc && !hasError

  if (showImage) {
    return (
      <img
        src={fullSrc}
        alt={username}
        style={style}
        className={`shrink-0 rounded-full object-cover ${className}`}
        onError={() => setHasError(true)}
      />
    )
  }

  return (
    <div
      style={style}
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#c7c7c7] to-[#8e8e8e] text-sm font-semibold uppercase text-white ${className}`}
    >
      {username?.charAt(0) || '?'}
    </div>
  )
}
