import { Outlet } from 'react-router-dom'
import { PostModalProvider } from '@/entities/post'

export const MainLayout = () => {
  return (
    <PostModalProvider>
      <Outlet />
    </PostModalProvider>
  )
}
