import { resolveMediaUrl } from '@/shared/lib/mediaUrl'
import type { StoryItem } from '../api/storyApi'

export const isValidStory = (story: StoryItem) => Boolean(resolveMediaUrl(story.media?.url))

export const filterValidStories = (stories: StoryItem[]) =>
  stories.filter(isValidStory)
