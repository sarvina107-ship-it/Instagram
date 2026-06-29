// shared/config/env.ts
// Global muhit sozlamalari — API manzili shu yerda saqlanadi

export const env = {
  // Dev: Vite proxy orqali CORS muammosiz ishlaydi
  API_URL: import.meta.env.DEV
    ? '/api'
    : 'https://adetal-ff-production.up.railway.app/api',
} as const

export const API_URL = env.API_URL
