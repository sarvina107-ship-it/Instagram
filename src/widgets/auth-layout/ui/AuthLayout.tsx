// widgets/auth-layout/ui/AuthLayout.tsx
// Login va Register uchun — markazlashgan, sodda wrapper.
// Har bir sahifa o'zining kartasini (logo + form + link) render qiladi.

import { Outlet } from 'react-router-dom'

export const AuthLayout = () => {
  return <Outlet />
}
