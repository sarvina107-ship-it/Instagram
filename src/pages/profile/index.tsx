// pages/profile — foydalanuvchi profili (placeholder)

import { useParams } from 'react-router-dom'

export default function ProfilePage() {
  const { username } = useParams()

  return (
    <div className="py-6">
      <header className="mb-8 flex items-center gap-6">
        <div className="h-20 w-20 shrink-0 rounded-full bg-gray-200 sm:h-32 sm:w-32" />
        <div>
          <h2 className="text-xl font-light">{username ?? 'foydalanuvchi'}</h2>
          <div className="mt-3 flex gap-6 text-sm">
            <span>
              <b>0</b> post
            </span>
            <span>
              <b>0</b> obunachi
            </span>
            <span>
              <b>0</b> obuna
            </span>
          </div>
        </div>
      </header>
      <div className="grid grid-cols-3 gap-1 border-t border-gray-200 pt-4 sm:gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-square rounded bg-gray-100" />
        ))}
      </div>
    </div>
  )
}
