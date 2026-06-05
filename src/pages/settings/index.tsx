// pages/settings — akkaunt sozlamalari (placeholder)

import { useNavigate } from 'react-router-dom'
import { Button } from '@/shared/ui'
import { session } from '@/shared/lib/session'
import { PATHS } from '@/shared/config/routes'

export default function SettingsPage() {
  const navigate = useNavigate()

  const logout = () => {
    session.removeToken()
    navigate(PATHS.LOGIN, { replace: true })
  }

  return (
    <div className="mx-auto max-w-[470px] py-6">
      <h2 className="mb-4 text-lg font-semibold">Sozlamalar</h2>
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="mb-4 text-sm text-gray-500">
          Profil sozlamalari API ulangach shu yerda ko'rinadi.
        </p>
        <Button onClick={logout} className="bg-red-500 hover:bg-red-600">
          Chiqish
        </Button>
      </div>
    </div>
  )
}
