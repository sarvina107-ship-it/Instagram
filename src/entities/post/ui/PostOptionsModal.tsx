import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { buildPath } from '@/shared/config/routes'
import { postApi } from '../api/postApi'
import type { Post } from '../model/types'

type PostOptionsModalProps = {
  post: Post
  isOwner: boolean
  onClose: () => void
  onDeleted?: () => void
}

export const PostOptionsModal = ({
  post,
  isOwner,
  onClose,
  onDeleted,
}: PostOptionsModalProps) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: () => postApi.delete(post._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.removeQueries({ queryKey: ['post', post._id] })
      onDeleted?.()
      onClose()
    },
  })

  const toggleCommentsMutation = useMutation({
    mutationFn: () => postApi.toggleComments(post._id),
    onSuccess: (data) => {
      queryClient.setQueryData<Post>(['post', post._id], (current) =>
        current ? { ...current, commentsEnabled: data.commentsEnabled } : current
      )
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      onClose()
    },
  })

  const handleDelete = () => {
    if (window.confirm('Удалить эту публикацию?')) {
      deleteMutation.mutate()
    }
  }

  const handleGoToPost = () => {
    onClose()
    navigate(buildPath.post(post._id))
  }

  const handleAboutAccount = () => {
    onClose()
    navigate(buildPath.profile(post.author.username))
  }

  const commentsEnabled = post.commentsEnabled !== false

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/65 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[400px] overflow-hidden rounded-xl bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        {isOwner && (
          <>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="w-full border-b border-[#dbdbdb] px-4 py-3.5 text-[14px] font-semibold text-[#ed4956] transition hover:bg-[#fafafa] disabled:opacity-50"
            >
              Удалить
            </button>

            <button
              type="button"
              onClick={() => {
                onClose()
                navigate(buildPath.editPost(post._id))
              }}
              className="w-full border-b border-[#dbdbdb] px-4 py-3.5 text-[14px] text-black transition hover:bg-[#fafafa]"
            >
              Редактировать
            </button>

            <button
              type="button"
              onClick={() => toggleCommentsMutation.mutate()}
              disabled={toggleCommentsMutation.isPending}
              className="w-full border-b border-[#dbdbdb] px-4 py-3.5 text-[14px] text-black transition hover:bg-[#fafafa] disabled:opacity-50"
            >
              {commentsEnabled ? 'Выключить комментарии' : 'Включить комментарии'}
            </button>
          </>
        )}

        <button
          type="button"
          onClick={handleGoToPost}
          className="w-full border-b border-[#dbdbdb] px-4 py-3.5 text-[14px] text-black transition hover:bg-[#fafafa]"
        >
          Перейти к публикации
        </button>

        <button
          type="button"
          onClick={handleAboutAccount}
          className="w-full border-b border-[#dbdbdb] px-4 py-3.5 text-[14px] text-black transition hover:bg-[#fafafa]"
        >
          Об аккаунте
        </button>

        <button
          type="button"
          onClick={onClose}
          className="w-full px-4 py-3.5 text-[14px] text-black transition hover:bg-[#fafafa]"
        >
          Отмена
        </button>
      </div>
    </div>
  )
}
