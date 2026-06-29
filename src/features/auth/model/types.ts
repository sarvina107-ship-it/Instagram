// features/auth/model/types.ts
// Auth bilan bog'liq tiplar — Swagger spec asosida

export interface LoginRequest {
  identifier: string
  password: string
}

export interface RegisterRequest {
  username: string
  fullName: string
  email: string
  password: string
}

export interface AuthResponse {
  _id: string
  username: string
  fullName: string
  email: string
  avatar?: string
  bio?: string
  token: string
}

export interface AuthUser {
  _id: string
  username: string
  fullName: string
  email: string
  avatar?: string
  bio?: string
  website?: string
  gender?: 'male' | 'female' | 'other' | ''
  followers: Array<User | string>
  following: Array<User | string>
  isPrivate: boolean
}
