import { api } from '@/shared/api/instance'
import type { Notification, UnreadCountResponse } from '../model/types'

export const notificationApi = {
  getAll: () => api.get<Notification[]>('/notifications'),

  getUnreadCount: () => api.get<UnreadCountResponse>('/notifications/unread/count'),

  markAllRead: () => api.put<{ message: string }>('/notifications/read'),

  delete: (id: string) => api.delete<{ message: string }>(`/notifications/${id}`),
}
