import type { Notification } from '../model/types'
import type { User } from '@/entities/user'

export const getNotificationActor = (notification: Notification): User | undefined =>
  notification.from ?? notification.actor ?? notification.user

export const isNotificationRead = (notification: Notification) =>
  Boolean(notification.read ?? notification.isRead)

export const getNotificationText = (notification: Notification) => {
  if (notification.text) return notification.text
  if (notification.message) return notification.message

  const actor = getNotificationActor(notification)
  const username = actor?.username ?? 'Пользователь'

  switch (notification.type) {
    case 'follow':
      return `${username} подписался(-ась) на ваши обновления.`
    case 'like':
      return `${username} оценил(-а) вашу публикацию.`
    case 'comment':
      return `${username} оставил(-а) комментарий.`
    case 'mention':
      return `${username} упомянул(-а) вас.`
    case 'story':
      return `${username} посмотрел(-а) вашу историю.`
    default:
      return `${username} отправил(-а) уведомление.`
  }
}

export const formatNotificationDate = (date: string) => {
  const value = new Date(date)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - value.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return value.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  }

  if (diffDays < 7) {
    return value.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  }

  return value.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

export const groupNotificationsByPeriod = (notifications: Notification[]) => {
  const now = new Date()
  const thisMonth: Notification[] = []
  const earlier: Notification[] = []

  notifications.forEach((notification) => {
    const date = new Date(notification.createdAt)
    const sameMonth =
      date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()

    if (sameMonth) thisMonth.push(notification)
    else earlier.push(notification)
  })

  return { thisMonth, earlier }
}
