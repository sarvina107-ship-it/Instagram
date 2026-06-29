// features/auth/model/store.ts
// Login / Register uchun React Query mutation hooklari.
// Muvaffaqiyatli javobda token localStorage ga saqlanadi (session orqali).

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { session } from '@/shared/lib/session'
import { authApi } from '../api/authApi'
import type { AuthResponse, LoginRequest, RegisterRequest } from './types'

export const AUTH_ME_QUERY_KEY = ['auth', 'me'] as const

const saveAuth = (data: AuthResponse, queryClient: ReturnType<typeof useQueryClient>) => {
  session.setToken(data.token)
  queryClient.invalidateQueries({ queryKey: AUTH_ME_QUERY_KEY })
}

export const useMe = () =>
  useQuery({
    queryKey: AUTH_ME_QUERY_KEY,
    queryFn: () => authApi.me(),
    enabled: session.isAuthenticated(),
  })

export const useLogin = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: LoginRequest) => authApi.login(body),
    onSuccess: (data) => saveAuth(data, queryClient),
  })
}

export const useRegister = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: RegisterRequest) => authApi.register(body),
    onSuccess: (data) => saveAuth(data, queryClient),
  })
}
