// entities/user/api.ts

import { api } from '@/shared/api/instance'
import type { AuthUser } from '@/features/auth/model/types'
import type { User } from '../model/types'
import type { UpdateProfilePayload } from '../model/updateProfile'

// ========== ТИПЫ ДЛЯ СООБЩЕНИЙ ==========
export interface Conversation {
  _id: string
  participants: User[]
  lastMessage?:
    | string
    | {
        text: string
        createdAt: string
        senderId: string
      }
  updatedAt: string
}

export interface Message {
  _id: string
  conversationId?: string
  conversation?: string
  senderId?: string
  sender?: User | string
  text?: string
  media?: string
  createdAt: string
}

export const getMessageSenderId = (message: Message) => {
  if (message.senderId) return message.senderId
  if (typeof message.sender === 'object' && message.sender?._id) {
    return message.sender._id
  }
  if (typeof message.sender === 'string') return message.sender
  return undefined
}

// ========== API МЕТОДЫ ==========
export const userApi = {
  // --- Существующие методы ---
  search: (query: string) =>
    api.get<User[]>(`/users?search=${encodeURIComponent(query)}`),

  getByUsername: (username: string) =>
    api.get<User>(`/users/${encodeURIComponent(username)}`),

  updateProfile: (payload: UpdateProfilePayload) => {
    const form = new FormData()
    if (payload.fullName !== undefined) form.append('fullName', payload.fullName)
    if (payload.bio !== undefined) form.append('bio', payload.bio)
    if (payload.website !== undefined) form.append('website', payload.website)
    if (payload.gender !== undefined) form.append('gender', payload.gender)
    if (payload.username !== undefined) form.append('username', payload.username)
    if (payload.isPrivate !== undefined) {
      form.append('isPrivate', String(payload.isPrivate))
    }
    if (payload.avatar) form.append('avatar', payload.avatar)
    if (payload.removeAvatar) form.append('removeAvatar', 'true')
    return api.put<AuthUser>('/users/profile', form)
  },

  getSuggestions: () =>
    api.get<User[]>(`/users/suggestions`),

  follow: (userId: string) =>
    api.post<{ following: boolean; message?: string }>(`/users/${userId}/follow`),

  getFollowers: (userId: string) =>
    api.get<User[]>(`/users/${userId}/followers`),

  getFollowing: (userId: string) =>
    api.get<User[]>(`/users/${userId}/following`),

  // --- СООБЩЕНИЯ ---

  // 1. Получить список чатов (conversations)
  getConversations: () =>
    api.get<Conversation[]>('/messages/conversations'),

  // 2. Получить сообщения в конкретном чате
  getMessages: (conversationId: string) =>
    api.get<Message[]>(`/messages/${conversationId}`),

  // 3. Отправить сообщение (текст или медиа)
  sendMessage: (conversationId: string, data: { text?: string; media?: File }) => {
    if (data.media) {
      const form = new FormData()
      if (data.text) form.append('text', data.text)
      form.append('media', data.media)
      return api.post<Message>(`/messages/${conversationId}`, form)
    }
    return api.post<Message>(`/messages/${conversationId}`, { text: data.text })
  },

  // 4. Создать новый чат (если нет существующего)
  createConversation: (userId: string) =>
    api.post<Conversation>('/messages/conversations', { userId }),

  // 5. Получить количество непрочитанных
  getUnreadCount: () =>
    api.get<{ count: number }>('/messages/unread/count'),
}