import type { AuthUser } from '@/features/auth/model/types'
import type { User } from '../model/types'

export const getUserId = (user: User | string) =>
  typeof user === 'string' ? user : user._id

const isIdInList = (list: Array<User | string> | undefined, targetId: string) =>
  list?.some((item) => getUserId(item) === targetId) ?? false

export const isUserFollowed = (
  currentUser: AuthUser | undefined,
  targetUserId: string,
  followers?: Array<User | string>
) => {
  if (!currentUser) return false

  if (isIdInList(currentUser.following, targetUserId)) return true

  return isIdInList(followers, currentUser._id)
}

export const getFollowListCount = (items?: Array<User | string>) => items?.length ?? 0

export const toggleFollowingList = (
  following: Array<User | string> | undefined,
  targetUserId: string,
  shouldFollow: boolean
) => {
  const list = following ?? []

  if (shouldFollow) {
    if (isIdInList(list, targetUserId)) return list
    return [...list, targetUserId]
  }

  return list.filter((item) => getUserId(item) !== targetUserId)
}

export const toggleFollowersList = (
  followers: Array<User | string> | undefined,
  followerId: string,
  shouldAdd: boolean
) => {
  const list = followers ?? []

  if (shouldAdd) {
    if (isIdInList(list, followerId)) return list
    return [...list, followerId]
  }

  return list.filter((item) => getUserId(item) !== followerId)
}
