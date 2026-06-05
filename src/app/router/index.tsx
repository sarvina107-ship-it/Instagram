// app/router/index.tsx
// BARCHA ROUTELAR — bitta joy, bitta fayl

import { createBrowserRouter } from 'react-router-dom'
import { PATHS } from '@/shared/config/routes'

// HOCs
import { PrivateRoute } from '@/app/hocs/PrivateRoute'
import { GuestRoute } from '@/app/hocs/GuestRoute'

// Layouts (widgets layeridan)
import { MainLayout } from '@/widgets/main-layout/ui/MainLayout'
import { AuthLayout } from '@/widgets/auth-layout/ui/AuthLayout'

// Pages (lazy — har bir sahifa kerak bo'lganda yuklanadi)
import { lazy } from 'react'

const FeedPage     = lazy(() => import('@/pages/feed'))
const ExplorePage  = lazy(() => import('@/pages/explore'))
const ProfilePage  = lazy(() => import('@/pages/profile'))
const SettingsPage = lazy(() => import('@/pages/settings'))
const LoginPage    = lazy(() => import('@/pages/login'))
const RegisterPage = lazy(() => import('@/pages/register'))
const NotFoundPage = lazy(() => import('@/pages/not-found'))

export const router = createBrowserRouter([
  // ═══════════════════════════════════════
  // PRIVATE ROUTES — token bo'lmasa /login
  // ═══════════════════════════════════════
  {
    element: <PrivateRoute />,       // ← Token tekshiradi
    children: [
      {
        element: <MainLayout />,     // ← Navbar + BottomNav bor
        children: [
          { path: PATHS.FEED,     element: <FeedPage /> },
          { path: PATHS.EXPLORE,  element: <ExplorePage /> },
          { path: PATHS.PROFILE,  element: <ProfilePage /> },
          { path: PATHS.SETTINGS, element: <SettingsPage /> },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════
  // GUEST ROUTES — login bo'lsa /feed ga
  // ═══════════════════════════════════════
  {
    element: <GuestRoute />,         // ← Allaqachon login? Feedga
    children: [
      {
        element: <AuthLayout />,     // ← Oq markazlashgan layout
        children: [
          { path: PATHS.LOGIN,    element: <LoginPage /> },
          { path: PATHS.REGISTER, element: <RegisterPage /> },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════
  // 404
  // ═══════════════════════════════════════
  { path: '*', element: <NotFoundPage /> },
])