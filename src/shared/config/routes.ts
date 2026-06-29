// shared/config/routes.ts
// Barcha path'lar shu yerda — string hardcode qilma hech qachon!

export const PATHS = {
  // Public routes
  LOGIN: '/login',
  REGISTER: '/register',

  // Private routes
  FEED: '/',
  SEARCH: '/search',
  EXPLORE: '/explore',
  PROFILE: '/profile/:username',  // 👈 Оставьте как есть, это для React Router
  POST: '/p/:postId',
  EDIT_POST: '/edit/:postId',
  REELS: '/reels',
  SETTINGS: '/accounts/edit',
  MESSAGES: '/messages',
  HASHTAG: '/tags/:tag',
} as const

// Dynamic route yaratish uchun helper
export const buildPath = {
  // 👇 ИСПРАВЛЕНО: используем правильный путь /profile/:username
  profile: (username: string) => `/profile/${username}`,
  post: (postId: string) => `/p/${postId}`,
  editPost: (postId: string) => `/edit/${postId}`,
  reels: () => PATHS.REELS,
  feed: () => PATHS.FEED,
  search: () => PATHS.SEARCH,
  explore: () => PATHS.EXPLORE,
  settings: () => PATHS.SETTINGS,
  settingsEditProfile: () => `${PATHS.SETTINGS}?section=edit-profile`,
  messages: () => PATHS.MESSAGES,
  hashtag: (tag: string) => `/tags/${encodeURIComponent(tag)}`,
  login: () => PATHS.LOGIN,
  register: () => PATHS.REGISTER,
}