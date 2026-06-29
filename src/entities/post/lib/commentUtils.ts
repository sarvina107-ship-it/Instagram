import type { AuthUser } from '@/features/auth/model/types'
import { getUserId } from '@/entities/user/lib/follow'
import type { PostComment } from '../model/types'

export const enrichComment = (
  comment: PostComment,
  currentUser?: AuthUser
): PostComment => {
  const likes = comment.likes ?? []
  const likesCount = comment.likesCount ?? likes.length
  const isLiked =
    comment.isLiked ??
    (currentUser
      ? likes.some((like) => getUserId(like) === currentUser._id)
      : false)

  return {
    ...comment,
    likesCount,
    isLiked,
  }
}

export const enrichComments = (
  comments: PostComment[] | undefined,
  currentUser?: AuthUser
) => (comments ?? []).map((comment) => enrichComment(comment, currentUser))
