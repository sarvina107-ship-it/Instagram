// shared/api/interceptors.ts
// So'rov va javob interceptorlari — token qo'shish va 401 ni ushlash

import { session } from '@/shared/lib/session'

export const attachAuthHeader = (headers: Headers): Headers => {
  const token = session.getToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  return headers
}

export const handleUnauthorized = (response: Response): void => {
  if (response.status === 401) {
    session.removeToken()
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
  }
}
