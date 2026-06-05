// shared/config/routes.ts
// Barcha path'lar shu yerda — string hardcode qilma hech qachon!

export const PATHS = {
    // Public routes
    LOGIN: '/login',
    REGISTER: '/register',
  
    // Private routes
    FEED: '/',
    EXPLORE: '/explore',
    PROFILE: '/profile/:username',
    POST: '/p/:postId',
    SETTINGS: '/accounts/edit',
  } as const
  
  // Dynamic route yaratish uchun helper
  export const buildPath = {
    profile: (username: string) => `/profile/${username}`,
    post: (postId: string) => `/p/${postId}`,
  }