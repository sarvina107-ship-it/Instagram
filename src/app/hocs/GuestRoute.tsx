// app/hocs/GuestRoute.tsx
// Allaqachon login bo'lgan odam /login ga kirsa — feedga jo'natiladi

import { Navigate, Outlet } from 'react-router-dom'
import { session } from '@/shared/lib/session'
import { PATHS } from '@/shared/config/routes'

export const GuestRoute = () => {
  const isAuth = session.isAuthenticated()

  // Token bor — asosiy sahifaga ketdi
  if (isAuth) {
    return <Navigate to={PATHS.FEED} replace />
  }

  // Token yo'q — login/register ko'rsatiladi
  return <Outlet />
}