// pages/not-found — 404 sahifa

import { Link } from 'react-router-dom'
import { PATHS } from '@/shared/config/routes'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-6xl font-bold text-gray-800">404</h1>
      <p className="text-gray-500">Bu sahifa mavjud emas.</p>
      <Link to={PATHS.FEED} className="font-semibold text-sky-500">
        Bosh sahifaga qaytish
      </Link>
    </div>
  )
}
