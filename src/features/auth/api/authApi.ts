// features/auth/api/authApi.ts
// Auth endpointlari — global api instance orqali

import { api } from '@/shared/api/instance'
import type {
  AuthResponse,
  AuthUser,
  LoginRequest,
  RegisterRequest,
} from '../model/types'

export const authApi = {
  login: (body: LoginRequest) => api.post<AuthResponse>('/auth/login', body),

  register: (body: RegisterRequest) => api.post<AuthResponse>('/auth/register', body),

  me: () => api.get<AuthUser>('/auth/me'),
}
