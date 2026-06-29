import { API_URL } from '@/shared/config/env'

const SERVER_ORIGIN = API_URL.replace(/\/api\/?$/, '')

export function resolveMediaUrl(path?: string | null): string | null {
  if (!path?.trim()) return null

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  if (path.startsWith('/')) {
    return `${SERVER_ORIGIN}${path}`
  }

  return `${SERVER_ORIGIN}/${path}`
}
