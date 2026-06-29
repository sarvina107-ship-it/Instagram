import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { UserAvatar } from '@/entities/user'
import { buildPath } from '@/shared/config/routes'
import { notificationApi } from '../api/notificationApi'
import {
  formatNotificationDate,
  getNotificationActor,
  getNotificationText,
  groupNotificationsByPeriod,
  isNotificationRead,
} from '../lib/formatNotification'
import type { Notification } from '../model/types'

type FilterTab = 'all' | 'following' | 'comments'

type NotificationsPanelProps = {
  isOpen: boolean
  onClose: () => void
}

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: 'all', label: 'Все' },
  { id: 'following', label: 'Люди, на которых вы подписаны' },
  { id: 'comments', label: 'Комментарии' },
]

const filterNotifications = (notifications: Notification[], tab: FilterTab) => {
  if (tab === 'following') {
    return notifications.filter((item) => item.type === 'follow')
  }

  if (tab === 'comments') {
    return notifications.filter((item) => item.type === 'comment' || item.type === 'mention')
  }

  return notifications
}

function NotificationRow({ notification }: { notification: Notification }) {
  const navigate = useNavigate()
  const actor = getNotificationActor(notification)
  const text = getNotificationText(notification)
  const isFollow = notification.type === 'follow'

  if (!actor) {
    return (
      <div className="flex items-center gap-3 px-4 py-3">
        <p className="text-[14px] text-black">{text}</p>
        <span className="ml-auto text-[12px] text-[#8e8e8e]">
          {formatNotificationDate(notification.createdAt)}
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-[#fafafa]">
      <button
        type="button"
        onClick={() => navigate(buildPath.profile(actor.username))}
        className="shrink-0"
      >
        <UserAvatar src={actor.avatar} username={actor.username} size={44} />
      </button>

      <button
        type="button"
        onClick={() => {
          if (notification.postId) {
            navigate(buildPath.post(notification.postId))
            return
          }
          navigate(buildPath.profile(actor.username))
        }}
        className="min-w-0 flex-1 text-left"
      >
        <p className="text-[14px] leading-snug text-black">
          <span className="font-semibold">{actor.username}</span>{' '}
          {text.replace(`${actor.username} `, '')}
        </p>
        <p className="mt-0.5 text-[12px] text-[#8e8e8e]">
          {formatNotificationDate(notification.createdAt)}
        </p>
      </button>

      {isFollow && (
        <button
          type="button"
          className="shrink-0 rounded-lg bg-[#efefef] px-4 py-[7px] text-[14px] font-semibold text-black hover:bg-[#e4e4e4]"
        >
          Подписки
        </button>
      )}

      {!isNotificationRead(notification) && (
        <span className="h-2 w-2 shrink-0 rounded-full bg-[#0095f6]" />
      )}
    </div>
  )
}

export const NotificationsPanel = ({ isOpen, onClose }: NotificationsPanelProps) => {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<FilterTab>('all')

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.getAll(),
    enabled: isOpen,
    refetchInterval: isOpen ? 10000 : false,
  })

  const { mutate: markAllRead } = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] })
    },
  })

  useEffect(() => {
    if (!isOpen) return

    void notificationApi.markAllRead().then(() => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] })
    })
  }, [isOpen, queryClient])

  const filtered = useMemo(
    () => filterNotifications(notifications, activeTab),
    [activeTab, notifications]
  )

  const { thisMonth, earlier } = useMemo(
    () => groupNotificationsByPeriod(filtered),
    [filtered]
  )

  if (!isOpen) return null

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[55] bg-black/20"
        onClick={onClose}
        aria-label="Закрыть уведомления"
      />

      <aside className="fixed left-[72px] top-0 z-[60] flex h-screen w-[min(400px,calc(100vw-72px))] flex-col border-r border-[#dbdbdb] bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#dbdbdb] px-5 py-4">
          <h2 className="text-[16px] font-bold text-black">Уведомления</h2>
          <button type="button" onClick={onClose} aria-label="Закрыть">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto border-b border-[#dbdbdb] px-4 py-3">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 rounded-lg px-3 py-2 text-[14px] font-semibold transition ${
                activeTab === tab.id
                  ? 'bg-black text-white'
                  : 'bg-[#efefef] text-black hover:bg-[#e4e4e4]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="flex justify-center py-16">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#dbdbdb] border-t-[#262626]" />
            </div>
          )}

          {!isLoading && filtered.length === 0 && (
            <div className="px-6 py-16 text-center text-[14px] text-[#8e8e8e]">
              Уведомлений пока нет
            </div>
          )}

          {!isLoading && thisMonth.length > 0 && (
            <section>
              <h3 className="px-4 py-3 text-[16px] font-bold text-black">В этом месяце</h3>
              {thisMonth.map((notification) => (
                <NotificationRow key={notification._id} notification={notification} />
              ))}
            </section>
          )}

          {!isLoading && earlier.length > 0 && (
            <section>
              <h3 className="px-4 py-3 text-[16px] font-bold text-black">Ранее</h3>
              {earlier.map((notification) => (
                <NotificationRow key={notification._id} notification={notification} />
              ))}
            </section>
          )}
        </div>

        {notifications.some((item) => !isNotificationRead(item)) && (
          <div className="border-t border-[#dbdbdb] p-4">
            <button
              type="button"
              onClick={() => markAllRead()}
              className="w-full rounded-lg bg-[#efefef] py-2 text-[14px] font-semibold text-black hover:bg-[#e4e4e4]"
            >
              Отметить все как прочитанные
            </button>
          </div>
        )}
      </aside>
    </>
  )
}
