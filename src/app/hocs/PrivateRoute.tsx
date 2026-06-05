// app/hocs/PrivateRoute.tsx
// Token bor => sahifani ko'rsat | Yo'q => loginga jo'nat

import { Navigate, Outlet } from 'react-router-dom'
import { session } from '@/shared/lib/session'
import { PATHS } from '@/shared/config/routes'

export const PrivateRoute = () => {
  const isAuth = session.isAuthenticated()

  // Token yo'q — /login ga ketdi
  if (!isAuth) {
    return <Navigate to={PATHS.LOGIN} replace />
  }

  // Token bor — ichidagi route render bo'ladi
  return <Outlet />
}