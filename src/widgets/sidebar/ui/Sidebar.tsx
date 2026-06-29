import type { LucideIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Clapperboard,
  Heart,
  Home,
  LayoutGrid,
  Menu,
  MessageCircle,
  PlusSquare,
  Search,
  UserCircle,
} from 'lucide-react'
import Logo2 from '@/assets/icons/Logo2.png'
import { useMe } from '@/features/auth'
import { NotificationsPanel, notificationApi } from '@/entities/notification'
import { resolveMediaUrl } from '@/shared/lib/mediaUrl'
import { buildPath, PATHS } from '@/shared/config/routes'
import { usePostModal } from '@/entities/post'
import { MoreMenu } from './MoreMenu'

type NavItemId =
  | 'home'
  | 'reels'
  | 'messages'
  | 'search'
  | 'notifications'
  | 'create'
  | 'profile'
  | 'more'
  | 'products'

type NavItem = {
  id: NavItemId
  label: string
  icon: LucideIcon
  to?: string
  showUnreadDot?: boolean
  profileAvatar?: boolean
}

const BASE_NAV_ITEMS: Omit<NavItem, 'to' | 'showUnreadDot'>[] = [
  { id: 'home', label: 'Главная', icon: Home },
  { id: 'reels', label: 'Reels', icon: Clapperboard },
  { id: 'messages', label: 'Сообщения', icon: MessageCircle },
  { id: 'search', label: 'Поисковый запрос', icon: Search },
  { id: 'notifications', label: 'Уведомления', icon: Heart },
  { id: 'create', label: 'Создать', icon: PlusSquare },
  { id: 'profile', label: 'Профиль', icon: UserCircle, profileAvatar: true },
]

const BOTTOM_NAV_ITEMS: NavItem[] = [
  { id: 'more', label: 'Ещё', icon: Menu },
  { id: 'products', label: 'Другие продукты ...', icon: LayoutGrid },
]

const navItemClass =
  'flex w-full items-center gap-4 rounded-lg px-3 py-3 transition hover:bg-[#f2f2f2]'

const navLabelClass =
  'max-w-0 overflow-hidden whitespace-nowrap text-[16px] opacity-0 transition-all duration-200 ease-out group-hover/sidebar:max-w-[200px] group-hover/sidebar:opacity-100'

function ProfileNavIcon({ active, avatar }: { active: boolean; avatar?: string }) {
  const avatarSrc = resolveMediaUrl(avatar)
  const avatarClassName = `h-full w-full rounded-full ${avatarSrc ? 'object-cover' : 'bg-[#dbdbdb]'}`

  if (active) {
    return (
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-black p-[1px]">
        {avatarSrc ? (
          <img src={avatarSrc} alt="" className={avatarClassName} />
        ) : (
          <div className={avatarClassName} />
        )}
      </div>
    )
  }

  if (avatarSrc) {
    return (
      <img src={avatarSrc} alt="" className="h-6 w-6 shrink-0 rounded-full object-cover" />
    )
  }

  return <UserCircle className="h-6 w-6 shrink-0" strokeWidth={1.5} />
}

function NavButton({
  item,
  isActive,
  homeFilled,
  avatar,
  onClick,
}: {
  item: NavItem
  isActive: boolean
  homeFilled: boolean
  avatar?: string
  onClick?: () => void
}) {
  const Icon = item.icon

  const icon =
    item.id === 'profile' && item.profileAvatar ? (
      <ProfileNavIcon active={isActive} avatar={avatar} />
    ) : (
      <span className="relative shrink-0">
        <Icon
          className={`h-6 w-6 ${item.id === 'home' && homeFilled ? 'fill-black stroke-black' : ''}`}
          strokeWidth={1.5}
        />
        {item.showUnreadDot && (
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#ff3040]" />
        )}
      </span>
    )

  const content = (
    <>
      {icon}
      <span
        className={`${navLabelClass} ${isActive ? 'font-bold text-black' : 'font-normal text-black'}`}
      >
        {item.label}
      </span>
    </>
  )

  if (item.to) {
    return (
      <Link to={item.to} className={navItemClass} onClick={onClick}>
        {content}
      </Link>
    )
  }

  return (
    <button type="button" className={navItemClass} onClick={onClick}>
      {content}
    </button>
  )
}

export const Sidebar = () => {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { data: user } = useMe()
  const { openCreatePost } = usePostModal()
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)

  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => notificationApi.getUnreadCount(),
    refetchInterval: 30000,
  })

  const unreadCount = unreadData?.count ?? 0
  const hasUnreadNotifications = unreadCount > 0

  const isFeed = pathname === PATHS.FEED
  const isReels = pathname === PATHS.REELS
  const isSearch = pathname === PATHS.SEARCH
  const isProfile = pathname.startsWith('/profile/')
  const isSettings = pathname === PATHS.SETTINGS

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false)
      }
    }

    if (isMoreOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMoreOpen])

  const navItems: NavItem[] = BASE_NAV_ITEMS.map((item) => {
    if (item.id === 'home') return { ...item, to: PATHS.FEED }
    if (item.id === 'reels') return { ...item, to: PATHS.REELS }
    if (item.id === 'messages') return { ...item, to: PATHS.MESSAGES }
    if (item.id === 'search') return { ...item, to: PATHS.SEARCH }
    if (item.id === 'notifications') {
      return { ...item, showUnreadDot: hasUnreadNotifications }
    }
    if (item.id === 'profile' && user?.username) {
      return { ...item, to: buildPath.profile(user.username) }
    }
    return item
  })

  const isItemActive = (id: NavItemId) => {
    if (id === 'home') return isFeed
    if (id === 'reels') return isReels
    if (id === 'messages') return pathname === PATHS.MESSAGES
    if (id === 'search') return isSearch
    if (id === 'notifications') return isNotificationsOpen
    if (id === 'profile') return isProfile
    if (id === 'more') return isMoreOpen || isSettings
    return false
  }

  const handleNavClick = (id: NavItemId) => {
    if (id === 'create') {
      openCreatePost()
      return
    }

    if (id === 'notifications') {
      setIsNotificationsOpen((open) => !open)
      setIsMoreOpen(false)
    }
  }

  return (
    <>
      <nav className="group/sidebar fixed left-0 top-0 z-50 flex h-screen w-[72px] flex-col justify-between overflow-visible border-r border-[#dbdbdb] bg-white px-3 py-6 transition-[width] duration-200 ease-out hover:w-[244px] hover:shadow-lg">
        <div className="space-y-1">
          <Link to={PATHS.FEED} className="mb-6 flex items-center px-3 py-2">
            <img src={Logo2} alt="Instagram" className="h-6 w-6 shrink-0 object-contain" />
          </Link>

          {navItems.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              isActive={isItemActive(item.id)}
              homeFilled={isFeed}
              avatar={user?.avatar}
              onClick={
                item.id === 'create' || item.id === 'notifications'
                  ? () => handleNavClick(item.id)
                  : undefined
              }
            />
          ))}
        </div>

        <div className="space-y-1">
          <div ref={moreRef} className="relative">
            {isMoreOpen && <MoreMenu onClose={() => setIsMoreOpen(false)} />}
            <NavButton
              item={BOTTOM_NAV_ITEMS[0]}
              isActive={isItemActive('more')}
              homeFilled={isFeed}
              onClick={() => {
                setIsNotificationsOpen(false)
                setIsMoreOpen((open) => !open)
              }}
            />
          </div>

          <NavButton
            item={BOTTOM_NAV_ITEMS[1]}
            isActive={false}
            homeFilled={isFeed}
            onClick={() => navigate(PATHS.FEED)}
          />
        </div>
      </nav>

      <NotificationsPanel
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
    </>
  )
}
