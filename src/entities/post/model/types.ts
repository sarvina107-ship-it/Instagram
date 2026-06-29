export interface PostAuthor {
  _id: string
  username: string
  fullName?: string
  avatar?: string
}

export interface PostMedia {
  url: string
  type: 'image' | 'video'
  _id?: string
}

export interface PostComment {
  _id: string
  post?: string
  author: PostAuthor
  text: string
  parentComment?: string | null
  likes?: Array<string | PostAuthor>
  likesCount?: number
  isLiked?: boolean
  createdAt: string
}

export interface Post {
  _id: string
  author: PostAuthor
  caption: string
  location?: string
  media: PostMedia[]
  hashtags?: string[]
  likes?: string[]
  comments?: PostComment[]
  likesCount?: number
  commentsCount?: number
  isLiked?: boolean
  isSaved?: boolean
  commentsEnabled?: boolean
  createdAt: string
  updatedAt?: string
}

export interface FeedResponse {
  posts: Post[]
  page: number
  totalPages: number
  hasMore: boolean
}

export interface LikeResponse {
  isLiked: boolean
  likesCount: number
}

export interface SaveResponse {
  isSaved: boolean
}

export interface CreatePostPayload {
  media: File[]
  caption?: string
  location?: string
}

export interface UpdatePostPayload {
  caption?: string
  location?: string
}

export interface CommentsToggleResponse {
  commentsEnabled: boolean
}
