type ChangeAvatarModalProps = {
  isOpen: boolean
  hasAvatar: boolean
  onClose: () => void
  onUpload: () => void
  onDelete: () => void
}

export const ChangeAvatarModal = ({
  isOpen,
  hasAvatar,
  onClose,
  onUpload,
  onDelete,
}: ChangeAvatarModalProps) => {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[400px] overflow-hidden rounded-xl bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-[#dbdbdb] px-4 py-4">
          <h2 className="text-center text-[16px] font-bold text-black">
            Изменить фото профиля
          </h2>
        </div>

        <button
          type="button"
          onClick={onUpload}
          className="w-full border-b border-[#dbdbdb] px-4 py-4 text-[14px] font-semibold text-[#0095f6] transition hover:bg-[#fafafa]"
        >
          Загрузить фото
        </button>

        {hasAvatar && (
          <button
            type="button"
            onClick={onDelete}
            className="w-full border-b border-[#dbdbdb] px-4 py-4 text-[14px] font-semibold text-[#ed4956] transition hover:bg-[#fafafa]"
          >
            Удалить текущее фото
          </button>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full px-4 py-4 text-[14px] text-black transition hover:bg-[#fafafa]"
        >
          Отмена
        </button>
      </div>
    </div>
  )
}
