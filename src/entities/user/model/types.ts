export interface User {
  _id: string
  username: string
  fullName: string
  avatar?: string
  bio?: string
  followers?: Array<User | string>
  following?: Array<User | string>
  isFollowing?: boolean
  postCount?: number
  posts?: unknown[]
}
