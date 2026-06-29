import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search,
  Send,
  ArrowLeft,
  MoreHorizontal,
  Paperclip,
  Smile,
  ChevronDown,
  SquarePen,
} from 'lucide-react'
import { AppLayout } from '@/widgets/app-layout/ui/AppLayout'
import { useMe } from '@/features/auth'
import {
  userApi,
  UserAvatar,
  getMessageSenderId,
  type Conversation,
  type Message,
  type User,
} from '@/entities/user'
import { buildPath } from '@/shared/config/routes'
import { resolveMediaUrl } from '@/shared/lib/mediaUrl'

type MessagesTab = 'inbox' | 'requests'

export default function MessagesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: currentUser } = useMe()
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [newMessageText, setNewMessageText] = useState('')
  const [isNewChatMode, setIsNewChatMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [activeTab, setActiveTab] = useState<MessagesTab>('inbox')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => userApi.getConversations(),
    refetchInterval: 5000,
  })

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', selectedConversation],
    queryFn: () => userApi.getMessages(selectedConversation!),
    enabled: !!selectedConversation,
    refetchInterval: selectedConversation ? 3000 : false,
  })

  const sendMessageMutation = useMutation({
    mutationFn: ({ conversationId, text }: { conversationId: string; text: string }) =>
      userApi.sendMessage(conversationId, { text }),
    onMutate: async ({ conversationId, text }) => {
      await queryClient.cancelQueries({ queryKey: ['messages', conversationId] })

      const optimisticMessage: Message = {
        _id: `temp-${Date.now()}`,
        conversationId,
        senderId: currentUser?._id,
        text,
        createdAt: new Date().toISOString(),
      }

      queryClient.setQueryData<Message[]>(['messages', conversationId], (old = []) => [
        ...old,
        optimisticMessage,
      ])

      return { optimisticId: optimisticMessage._id }
    },
    onSuccess: (newMessage, variables, context) => {
      queryClient.setQueryData<Message[]>(['messages', variables.conversationId], (old = []) => {
        const withoutTemp = old.filter((item) => item._id !== context?.optimisticId)
        const exists = withoutTemp.some((item) => item._id === newMessage._id)
        return exists ? withoutTemp : [...withoutTemp, newMessage as Message]
      })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
    onError: (_error, variables, context) => {
      queryClient.setQueryData<Message[]>(['messages', variables.conversationId], (old = []) =>
        old.filter((item) => item._id !== context?.optimisticId)
      )
    },
  })

  const searchUsers = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setSearchResults([])
        return
      }

      try {
        const results = await userApi.search(query)
        const users = Array.isArray(results) ? results : []
        setSearchResults(users.filter((user) => user._id !== currentUser?._id))
      } catch {
        setSearchResults([])
      }
    },
    [currentUser?._id]
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      void searchUsers(searchQuery)
    }, 400)

    return () => clearTimeout(timer)
  }, [searchQuery, searchUsers])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversation(conversationId)
    setIsNewChatMode(false)
  }

  const handleSendMessage = () => {
    if (!selectedConversation || !newMessageText.trim()) return

    sendMessageMutation.mutate({
      conversationId: selectedConversation,
      text: newMessageText.trim(),
    })
    setNewMessageText('')
  }

  const handleStartNewChat = async (user: User) => {
    const existing = conversations.find((conversation) =>
      conversation.participants.some((participant) => participant._id === user._id)
    )

    if (existing) {
      setSelectedConversation(existing._id)
      setIsNewChatMode(false)
    } else {
      try {
        const newConversation = await userApi.createConversation(user._id)
        setSelectedConversation(newConversation._id)
        setIsNewChatMode(false)
        queryClient.setQueryData<Conversation[]>(['conversations'], (old = []) => {
          const exists = old.some((item) => item._id === newConversation._id)
          return exists ? old : [newConversation, ...old]
        })
      } catch {
        return
      }
    }

    setSearchQuery('')
    setSearchResults([])
    setActiveTab('inbox')
  }

  const getOtherUser = (conversation: Conversation) =>
    conversation.participants.find((participant) => participant._id !== currentUser?._id)

  const getLastMessageText = (conversation: Conversation) => {
    if (!conversation.lastMessage) return 'Начните общение'
    if (typeof conversation.lastMessage === 'string') return conversation.lastMessage
    return conversation.lastMessage.text || 'Начните общение'
  }

  const getLastMessageDate = (conversation: Conversation) => {
    if (!conversation.lastMessage || typeof conversation.lastMessage === 'string') {
      return conversation.updatedAt
    }

    return conversation.lastMessage.createdAt || conversation.updatedAt
  }

  const formatMessageTime = (date: string) =>
    new Date(date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

  const renderConversationsList = () => {
    if (conversationsLoading) {
      return <div className="p-6 text-center text-[14px] text-[#8e8e8e]">Загрузка...</div>
    }

    if (conversations.length === 0) {
      return (
        <div className="px-6 py-10 text-center text-[14px] text-[#8e8e8e]">
          Chats will appear here after you send or receive a message
        </div>
      )
    }

    return conversations.map((conversation) => {
      const otherUser = getOtherUser(conversation)
      if (!otherUser) return null

      const isActive = selectedConversation === conversation._id

      return (
        <button
          key={conversation._id}
          type="button"
          className={`flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-[#fafafa] ${
            isActive ? 'bg-[#fafafa]' : ''
          }`}
          onClick={() => handleSelectConversation(conversation._id)}
        >
          <UserAvatar src={otherUser.avatar} username={otherUser.username} size={56} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-[14px] font-semibold text-black">{otherUser.username}</p>
              <span className="shrink-0 text-[12px] text-[#8e8e8e]">
                {new Date(getLastMessageDate(conversation)).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
            </div>
            <p className="truncate text-[14px] text-[#8e8e8e]">{getLastMessageText(conversation)}</p>
          </div>
        </button>
      )
    })
  }

  const renderMessages = () => {
    if (!selectedConversation) {
      return (
        <div className="flex h-full flex-col items-center justify-center px-8 text-center">
          <div className="mb-6 flex h-[96px] w-[96px] items-center justify-center rounded-full border border-black">
            <Send className="h-10 w-10 -rotate-12" strokeWidth={1.2} />
          </div>
          <h2 className="mb-2 text-[20px] font-semibold text-black">Ваши сообщения</h2>
          <p className="mb-6 max-w-[350px] text-[14px] text-[#8e8e8e]">
            Отправляйте личные фото и сообщения другу или группе
          </p>
          <button
            type="button"
            onClick={() => setIsNewChatMode(true)}
            className="rounded-lg bg-[#0095f6] px-5 py-2 text-[14px] font-semibold text-white hover:bg-[#1877f2]"
          >
            Отправить сообщение
          </button>
        </div>
      )
    }

    const conversation = conversations.find((item) => item._id === selectedConversation)
    const otherUser = conversation ? getOtherUser(conversation) : null

    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center border-b border-[#dbdbdb] px-4 py-3">
          <button
            type="button"
            onClick={() => setSelectedConversation(null)}
            className="mr-2 lg:hidden"
            aria-label="Назад"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          {otherUser && (
            <button
              type="button"
              className="flex min-w-0 items-center gap-3"
              onClick={() => navigate(buildPath.profile(otherUser.username))}
            >
              <UserAvatar src={otherUser.avatar} username={otherUser.username} size={44} />
              <span className="truncate text-[16px] font-semibold text-black">
                {otherUser.username}
              </span>
            </button>
          )}
          <button type="button" className="ml-auto" aria-label="Ещё">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {messagesLoading ? (
            <div className="text-center text-[14px] text-[#8e8e8e]">Загрузка...</div>
          ) : messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-[14px] text-[#8e8e8e]">
              Сообщений пока нет. Напишите первое сообщение.
            </div>
          ) : (
            messages.map((message) => {
              const isMine = getMessageSenderId(message) === currentUser?._id
              const mediaUrl = resolveMediaUrl(message.media)

              return (
                <div
                  key={message._id}
                  className={`mb-3 flex ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-[22px] px-4 py-2 ${
                      isMine ? 'bg-[#0095f6] text-white' : 'bg-[#efefef] text-black'
                    }`}
                  >
                    {message.text && <p className="break-words text-[15px]">{message.text}</p>}
                    {mediaUrl && (
                      <img
                        src={mediaUrl}
                        alt="media"
                        className="mt-1 max-h-60 rounded-lg object-cover"
                      />
                    )}
                    <span className="mt-1 block text-right text-[11px] opacity-70">
                      {formatMessageTime(message.createdAt)}
                    </span>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-[#dbdbdb] p-4">
          <div className="flex items-center gap-3 rounded-full border border-[#dbdbdb] px-4 py-2">
            <button type="button" className="text-[#8e8e8e]" aria-label="Вложение">
              <Paperclip className="h-5 w-5" />
            </button>
            <input
              type="text"
              value={newMessageText}
              onChange={(event) => setNewMessageText(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && handleSendMessage()}
              placeholder="Напишите сообщение..."
              className="min-w-0 flex-1 text-[14px] outline-none placeholder:text-[#8e8e8e]"
            />
            <button type="button" className="text-[#8e8e8e]" aria-label="Смайл">
              <Smile className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={handleSendMessage}
              disabled={!newMessageText.trim() || sendMessageMutation.isPending}
              className="text-[#0095f6] disabled:opacity-40"
              aria-label="Отправить"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderNewChat = () => (
    <div className="flex h-full flex-col">
      <div className="flex items-center border-b border-[#dbdbdb] px-4 py-3">
        <button
          type="button"
          onClick={() => setIsNewChatMode(false)}
          className="mr-2"
          aria-label="Назад"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="text-[16px] font-semibold">Новое сообщение</span>
      </div>
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8e8e8e]" />
          <input
            type="text"
            placeholder="Кому: Поиск..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full rounded-lg bg-[#efefef] py-2 pl-10 pr-4 text-[14px] outline-none"
          />
        </div>
        <div className="mt-4 space-y-1">
          {searchResults.map((user) => (
            <button
              key={user._id}
              type="button"
              className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-[#fafafa]"
              onClick={() => void handleStartNewChat(user)}
            >
              <UserAvatar src={user.avatar} username={user.username} size={44} />
              <div className="min-w-0">
                <p className="truncate text-[14px] font-semibold text-black">{user.username}</p>
                <p className="truncate text-[14px] text-[#8e8e8e]">{user.fullName}</p>
              </div>
            </button>
          ))}
          {searchQuery && searchResults.length === 0 && (
            <div className="py-6 text-center text-[14px] text-[#8e8e8e]">
              Пользователи не найдены
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <AppLayout>
      <div className="mx-auto flex h-[calc(100vh-56px)] w-full max-w-[935px] overflow-hidden border border-[#dbdbdb] bg-white">
        <div
          className={`flex w-full flex-col border-r border-[#dbdbdb] lg:w-[397px] ${
            selectedConversation ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <div className="flex items-center justify-between px-5 py-4">
            <button type="button" className="flex items-center gap-2">
              <span className="text-[16px] font-bold text-black">
                {currentUser?.username ?? 'Сообщения'}
              </span>
              <ChevronDown className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsNewChatMode(true)}
              className="text-black"
              aria-label="Новое сообщение"
            >
              <SquarePen className="h-6 w-6" strokeWidth={1.5} />
            </button>
          </div>

          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8e8e8e]" />
              <input
                type="text"
                placeholder="Поиск"
                className="w-full rounded-lg bg-[#efefef] py-2 pl-10 pr-4 text-[14px] outline-none placeholder:text-[#8e8e8e]"
              />
            </div>
          </div>

          <div className="px-4 pb-4">
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="absolute -top-8 left-1/2 w-max -translate-x-1/2 rounded-2xl border border-[#dbdbdb] bg-white px-3 py-1.5 text-[12px] text-[#262626] shadow-sm">
                  Мотивация на утро..
                </div>
                <UserAvatar
                  src={currentUser?.avatar}
                  username={currentUser?.username ?? 'you'}
                  size={56}
                />
              </div>
              <span className="mt-2 text-[12px] text-black">Ваша заметка</span>
            </div>
          </div>

          <div className="flex items-center justify-between border-b border-[#dbdbdb] px-5 pb-3">
            <button
              type="button"
              onClick={() => setActiveTab('inbox')}
              className={`text-[16px] font-semibold ${
                activeTab === 'inbox' ? 'text-black' : 'text-[#8e8e8e]'
              }`}
            >
              Сообщения
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('requests')}
              className={`text-[16px] font-semibold ${
                activeTab === 'requests' ? 'text-black' : 'text-[#8e8e8e]'
              }`}
            >
              Запросы
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isNewChatMode ? (
              renderNewChat()
            ) : activeTab === 'requests' ? (
              <div className="px-6 py-10 text-center text-[14px] text-[#8e8e8e]">
                Запросов на переписку пока нет
              </div>
            ) : (
              renderConversationsList()
            )}
          </div>
        </div>

        <div className={`flex-1 ${selectedConversation ? 'flex' : 'hidden lg:flex'}`}>
          {renderMessages()}
        </div>
      </div>
    </AppLayout>
  )
}
