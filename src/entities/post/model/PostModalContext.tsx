import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { CreatePostModal } from '../ui/CreatePostModal'
import { PostDetailModal } from '../ui/PostDetailModal'

type PostModalContextValue = {
  openCreatePost: () => void
  openPostDetail: (postId: string) => void
  closeModals: () => void
}

const PostModalContext = createContext<PostModalContextValue | null>(null)

export const PostModalProvider = ({ children }: { children: ReactNode }) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [activePostId, setActivePostId] = useState<string | null>(null)

  const openCreatePost = useCallback(() => {
    setActivePostId(null)
    setIsCreateOpen(true)
  }, [])

  const openPostDetail = useCallback((postId: string) => {
    setIsCreateOpen(false)
    setActivePostId(postId)
  }, [])

  const closeModals = useCallback(() => {
    setIsCreateOpen(false)
    setActivePostId(null)
  }, [])

  const value = useMemo(
    () => ({ openCreatePost, openPostDetail, closeModals }),
    [openCreatePost, openPostDetail, closeModals]
  )

  return (
    <PostModalContext.Provider value={value}>
      {children}
      {isCreateOpen && <CreatePostModal onClose={closeModals} />}
      {activePostId && (
        <PostDetailModal postId={activePostId} onClose={closeModals} />
      )}
    </PostModalContext.Provider>
  )
}

export const usePostModal = () => {
  const context = useContext(PostModalContext)
  if (!context) {
    throw new Error('usePostModal must be used within PostModalProvider')
  }
  return context
}
