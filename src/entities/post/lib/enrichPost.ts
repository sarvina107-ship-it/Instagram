import { getUserId } from '@/entities/user/lib/follow'
import type { AuthUser } from '@/features/auth/model/types'
import type { Post } from '../model/types'

export const enrichPost = (post: Post, currentUser?: AuthUser): Post => ({
  ...post,
  likesCount: post.likesCount ?? post.likes?.length ?? 0,
  isLiked: Boolean(
    post.isLiked ??
      (post as Post & { liked?: boolean }).liked ??
      (currentUser
        ? post.likes?.some((like) => getUserId(like) === currentUser._id)
        : false)
  ),
  commentsCount: post.commentsCount ?? post.comments?.length ?? 0,
})

export const enrichPosts = (posts: Post[], currentUser?: AuthUser) =>
  posts.map((post) => enrichPost(post, currentUser))
