export type UpdateProfilePayload = {
  fullName?: string
  bio?: string
  website?: string
  gender?: string
  username?: string
  isPrivate?: boolean
  avatar?: File
  removeAvatar?: boolean
}
