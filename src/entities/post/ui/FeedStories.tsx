import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useMe } from '@/features/auth'
import { UserAvatar } from '@/entities/user'
import { getUserId } from '@/entities/user/lib/follow'
import type { User } from '@/entities/user/model/types'
import { buildPath } from '@/shared/config/routes'
import { storyApi } from '../api/storyApi'
import { filterValidStories } from '../lib/storyUtils'
import { CreateStoryModal } from './CreateStoryModal'
import { StoryViewerModal } from './StoryViewerModal'

type StoryCircleUser = {
  _id: string
  username: string
  avatar?: string
  hasStory: boolean
  hasUnseen: boolean
}

const sortStoryUsers = (users: StoryCircleUser[]) => {
  return [...users].sort((a, b) => {
    if (a.hasStory !== b.hasStory) return a.hasStory ? -1 : 1
    if (a.hasStory && b.hasStory && a.hasUnseen !== b.hasUnseen) {
      return a.hasUnseen ? -1 : 1
    }
    return 0
  })
}

export const FeedStories = () => {
  const navigate = useNavigate()
  const { data: currentUser } = useMe()
  const [isViewerOpen, setIsViewerOpen] = useState(false)
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(0)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const { data: storyGroups = [] } = useQuery({
    queryKey: ['stories', 'feed'],
    queryFn: () => storyApi.getFeed(),
  })

  const storyGroupsWithValidMedia = useMemo(
    () =>
      storyGroups
        .map((group) => ({
          ...group,
          stories: filterValidStories(group.stories),
        }))
        .filter((group) => group.stories.length > 0),
    [storyGroups]
  )

  const storyUsers = useMemo(() => {
    if (!currentUser) return []

    const storyMap = new Map(
      storyGroupsWithValidMedia.map((group) => [group.author._id, group])
    )

    const self: StoryCircleUser = {
      _id: currentUser._id,
      username: 'Ваша история',
      avatar: currentUser.avatar,
      hasStory: storyMap.has(currentUser._id),
      hasUnseen: storyMap.get(currentUser._id)?.hasUnseen ?? false,
    }

    const following = (currentUser.following ?? [])
      .map((item) => (typeof item === 'object' ? item : null))
      .filter((user): user is User => !!user)

    const followingUsers = following.map((user) => {
      const group = storyMap.get(user._id)
      return {
        _id: user._id,
        username: user.username,
        avatar: user.avatar,
        hasStory: !!group,
        hasUnseen: group?.hasUnseen ?? false,
      }
    })

    return [self, ...sortStoryUsers(followingUsers)]
  }, [currentUser, storyGroupsWithValidMedia])

  if (!storyUsers.length) return null

  return (
    <>
      <div className="mb-6 flex gap-4 overflow-x-auto pb-2">
        {storyUsers.map((user) => {
          const ringClass = user.hasStory
            ? user.hasUnseen
              ? 'bg-gradient-to-tr from-[#feda75] via-[#fa7e1e] via-[#d62976] to-[#962fbf]'
              : 'bg-[#dbdbdb]'
            : 'bg-[#dbdbdb]'

          return (
            <button
              key={user._id}
              type="button"
              onClick={() => {
                const groupIndex = storyGroupsWithValidMedia.findIndex(
                  (g) => g.author._id === user._id
                )

                if (groupIndex >= 0) {
                  setSelectedGroupIndex(groupIndex)
                  setIsViewerOpen(true)
                  return
                }

                if (user._id === currentUser?._id) {
                  setIsCreateOpen(true)
                  return
                }

                const followingUser = currentUser?.following?.find(
                  (item) => getUserId(item) === user._id
                )
                const username =
                  typeof followingUser === 'object' ? followingUser.username : undefined

                if (username) navigate(buildPath.profile(username))
              }}
              className="flex shrink-0 flex-col items-center gap-1"
            >
              <div className={`rounded-full p-[2px] ${ringClass}`}>
                <div className="rounded-full bg-white p-[2px]">
                  <UserAvatar src={user.avatar} username={user.username} size={56} />
                </div>
              </div>
              <span className="max-w-[64px] truncate text-[12px] text-black">
                {user.username}
              </span>
            </button>
          )
        })}
      </div>

      <CreateStoryModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />

      {storyGroupsWithValidMedia.length > 0 && (
        <StoryViewerModal
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
          groups={storyGroupsWithValidMedia}
          initialGroupIndex={selectedGroupIndex}
        />
      )}
    </>
  )
}
