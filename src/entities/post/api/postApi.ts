import { api } from '@/shared/api/instance'
import type {
  CommentsToggleResponse,
  CreatePostPayload,
  FeedResponse,
  LikeResponse,
  Post,
  PostComment,
  SaveResponse,
  UpdatePostPayload,
} from '../model/types'

export const postApi = {
  create: (payload: CreatePostPayload) => {
    const form = new FormData()
    payload.media.forEach((file) => form.append('media', file))
    if (payload.caption) form.append('caption', payload.caption)
    if (payload.location) form.append('location', payload.location)
    return api.post<Post>('/posts', form)
  },

  getById: (postId: string) => api.get<Post>(`/posts/${postId}`),

  getUserPosts: (userId: string) => api.get<Post[]>(`/posts/user/${userId}`),

  getFeed: (page = 1, limit = 10) =>
    api.get<FeedResponse>(`/posts/feed?page=${page}&limit=${limit}`),

  getExplore: (page = 1, limit = 24) =>
    api.get<Post[]>(`/posts/explore?page=${page}&limit=${limit}`),

  searchHashtags: (query: string) =>
    api.get<Array<{ tag: string; postsCount: number }>>(
      `/posts/hashtags/search?q=${encodeURIComponent(query)}`
    ),

  getByHashtag: (tag: string) =>
    api.get<Post[]>(`/posts/hashtag/${encodeURIComponent(tag)}`),

  getSaved: () => api.get<Post[]>('/posts/saved'),

  toggleLike: (postId: string) => api.post<LikeResponse>(`/posts/${postId}/like`),

  toggleSave: (postId: string) => api.post<SaveResponse>(`/posts/${postId}/save`),

  delete: (postId: string) => api.delete<{ message: string }>(`/posts/${postId}`),

  update: (postId: string, payload: UpdatePostPayload) =>
    api.put<Post>(`/posts/${postId}`, payload),

  toggleComments: (postId: string) =>
    api.patch<CommentsToggleResponse>(`/posts/${postId}/comments-toggle`),

  getReels: (limit = 20) =>
    api.get<Post[]>(`/posts/reels?limit=${limit}`),

  getComments: (postId: string) => api.get<PostComment[]>(`/posts/${postId}/comments`),

  addComment: (postId: string, text: string, parentComment?: string) =>
    api.post<PostComment>(`/posts/${postId}/comments`, {
      text,
      ...(parentComment ? { parentComment } : {}),
    }),

  toggleCommentLike: (commentId: string) =>
    api.post<LikeResponse>(`/comments/${commentId}/like`),
}
