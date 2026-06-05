// shared/lib/session.ts
// Token bor yoki yo'qligini tekshiradi — PrivateRoute shu yerdan o'qiydi

const TOKEN_KEY = 'access_token'

export const session = {
  getToken: (): string | null => localStorage.getItem(TOKEN_KEY),

  setToken: (token: string): void => localStorage.setItem(TOKEN_KEY, token),

  removeToken: (): void => localStorage.removeItem(TOKEN_KEY),

  isAuthenticated: (): boolean => !!localStorage.getItem(TOKEN_KEY),
}