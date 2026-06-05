// widgets/main-layout/ui/MainLayout.tsx
// Login bo'lgan userlar ko'radigan asosiy layout

import { NavLink, Outlet } from 'react-router-dom'
import { PATHS } from '@/shared/config/routes'

const NAV = [
  { to: PATHS.FEED, label: 'Lenta', end: true },
  { to: PATHS.EXPLORE, label: 'Kashf qilish' },
  { to: PATHS.SETTINGS, label: 'Sozlamalar' },
]

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium transition ${
    isActive ? 'text-gray-900' : 'text-gray-400 hover:text-gray-700'
  }`

export const MainLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* TOP NAVBAR — desktop */}
      <header className="fixed left-0 right-0 top-0 z-50 h-[60px] border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-full max-w-[975px] items-center justify-between px-4">
          <NavLink to={PATHS.FEED} className="font-serif text-xl italic">
            Instagram
          </NavLink>
          <nav className="flex items-center gap-5">
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {/* MAIN CONTENT — navbar balandligi uchun padding */}
      <main className="mx-auto max-w-[975px] px-4 pt-[60px]">
        <Outlet /> {/* ← Sahifa content shu yerga render bo'ladi */}
      </main>
    </div>
  )
}
