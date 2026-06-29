// shared/api/instance.ts
// API_URL asosidagi fetch wrapper — interceptorlar bilan global instance

import { API_URL } from '@/shared/config/env'
import { attachAuthHeader, handleUnauthorized } from './interceptors'

type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown }

class ApiError extends Error {
  status: number
  data: unknown

  constructor(message: string, status: number, data: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers: customHeaders, ...rest } = options

  const headers = new Headers(customHeaders)
  attachAuthHeader(headers)

  const isFormData = body instanceof FormData
  if (body !== undefined && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers,
    body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
  })

  const isAuthRoute = path.startsWith('/auth/login') || path.startsWith('/auth/register')
  if (!isAuthRoute) {
    handleUnauthorized(response)
  }

  const contentType = response.headers.get('Content-Type') ?? ''
  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.text()

  if (!response.ok) {
    const message =
      (data as { message?: string })?.message ?? `Request failed: ${response.status}`
    throw new ApiError(message, response.status, data)
  }

  return data as T
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'GET' }),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),

  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PUT', body }),

  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body }),

  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
}

export { ApiError }
