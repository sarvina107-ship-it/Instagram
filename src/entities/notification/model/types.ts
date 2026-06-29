import type { User } from '@/entities/user'

export type NotificationType =
  | 'follow'
  | 'like'
  | 'comment'
  | 'mention'
  | 'story'
  | string

export interface Notification {
  _id: string
  type: NotificationType
  from?: User
  actor?: User
  user?: User
  message?: string
  text?: string
  read?: boolean
  isRead?: boolean
  createdAt: string
  post?: string
  postId?: string
}

export interface UnreadCountResponse {
  count: number
}
