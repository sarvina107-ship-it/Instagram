// widgets/auth-layout/ui/AuthLayout.tsx
// Login va Register uchun — markazlashgan, sodda wrapper.
// Har bir sahifa o'zining kartasini (logo + form + link) render qiladi.

import { Outlet } from 'react-router-dom'

export const AuthLayout = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-[350px]">
        <Outlet />
      </div>
    </div>
  )
}
