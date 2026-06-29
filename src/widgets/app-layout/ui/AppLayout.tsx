import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { buildPath } from '@/shared/config/routes'
import { Sidebar } from '@/widgets/sidebar/ui/Sidebar'

type AppLayoutProps = {
  children: ReactNode
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white text-[#262626]">
      <Sidebar />

      <div className="ml-[72px]">{children}</div>

      <button
        type="button"
        onClick={() => navigate(buildPath.messages())}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full border border-[#dbdbdb] bg-white px-4 py-3 text-[16px] font-semibold shadow-lg transition hover:bg-[#fafafa]"
      >
        <MessageCircle className="h-5 w-5" strokeWidth={1.5} />
        Сообщения
      </button>
    </div>
  )
}