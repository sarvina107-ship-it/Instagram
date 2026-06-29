import { api } from '@/shared/api/instance'
import type { LikeResponse, PostAuthor, PostMedia } from '../model/types'

export interface StoryViewerUser extends PostAuthor {
  viewedAt?: string
}

export interface StoryItem {
  _id: string
  author?: PostAuthor
  media: PostMedia
  caption?: string
  seen?: boolean
  isLiked?: boolean
  likesCount?: number
  viewsCount?: number
  viewers?: StoryViewerUser[]
  createdAt: string
}

export interface StoryGroup {
  author: PostAuthor
  stories: StoryItem[]
  hasUnseen: boolean
}

export type CreateStoryPayload = {
  caption?: string
  media: File
}

export const storyApi = {
  getFeed: () => api.get<StoryGroup[]>('/stories/feed'),

  getUserStories: (userId: string) => api.get<StoryItem[]>(`/stories/user/${userId}`),

  create: (payload: CreateStoryPayload) => {
    const form = new FormData()
    form.append('media', payload.media)
    if (payload.caption) form.append('caption', payload.caption)
    return api.post<StoryItem>('/stories', form)
  },

  markViewed: (storyId: string) => api.post<{ message: string }>(`/stories/${storyId}/view`),

  delete: (storyId: string) => api.delete<{ message: string }>(`/stories/${storyId}`),

  toggleLike: (storyId: string) => api.post<LikeResponse>(`/stories/${storyId}/like`),

  getViewers: (storyId: string) =>
    api.get<StoryViewerUser[]>(`/stories/${storyId}/viewers`),
}
