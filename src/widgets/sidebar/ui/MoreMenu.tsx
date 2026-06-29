import { useNavigate } from 'react-router-dom'
import {
  Activity,
  AlertCircle,
  Bookmark,
  Settings,
  Sun,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { AUTH_ME_QUERY_KEY } from '@/features/auth'
import { PATHS } from '@/shared/config/routes'
import { session } from '@/shared/lib/session'

type MoreMenuProps = {
  onClose: () => void
}

const menuItemClass =
  'flex w-full items-center gap-3 px-4 py-3 text-left text-[14px] text-black transition hover:bg-[#fafafa]'

export const MoreMenu = ({ onClose }: MoreMenuProps) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const goSettings = () => {
    onClose()
    navigate(PATHS.SETTINGS)
  }

  const logout = () => {
    session.removeToken()
    queryClient.removeQueries({ queryKey: AUTH_ME_QUERY_KEY })
    onClose()
    navigate(PATHS.LOGIN, { replace: true })
  }

  return (
    <div className="absolute bottom-full left-0 z-[60] mb-2 w-[266px] overflow-hidden rounded-xl border border-[#dbdbdb] bg-white py-2 shadow-xl">
      <button type="button" onClick={goSettings} className={menuItemClass}>
        <Settings className="h-5 w-5 shrink-0" strokeWidth={1.5} />
        Настройки
      </button>
      <button type="button" onClick={onClose} className={menuItemClass}>
        <Activity className="h-5 w-5 shrink-0" strokeWidth={1.5} />
        Ваши действия
      </button>
      <button type="button" onClick={onClose} className={menuItemClass}>
        <Bookmark className="h-5 w-5 shrink-0" strokeWidth={1.5} />
        Сохраненное
      </button>
      <button type="button" onClick={onClose} className={menuItemClass}>
        <Sun className="h-5 w-5 shrink-0" strokeWidth={1.5} />
        Переключить режим
      </button>
      <button type="button" onClick={onClose} className={menuItemClass}>
        <AlertCircle className="h-5 w-5 shrink-0" strokeWidth={1.5} />
        Сообщить о проблеме
      </button>

      <div className="my-2 border-t border-[#dbdbdb]" />

      <button type="button" onClick={onClose} className={`${menuItemClass} text-[14px]`}>
        Переключение между аккаунта...
      </button>

      <div className="my-2 border-t border-[#dbdbdb]" />

      <button type="button" onClick={logout} className={`${menuItemClass} text-[14px]`}>
        Выйти
      </button>
    </div>
  )
}
