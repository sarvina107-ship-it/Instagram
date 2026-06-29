import { useQuery } from '@tanstack/react-query'
import { postApi } from '../api/postApi'
import { getActiveHashtagQuery } from '../lib/hashtagUtils'

export const useHashtagSuggestions = (
  text: string,
  cursorPosition: number,
  enabled = true
) => {
  const activeQuery = getActiveHashtagQuery(text, cursorPosition)
  const isTypingHashtag = activeQuery !== null

  return useQuery({
    queryKey: ['hashtags', 'search', activeQuery ?? ''],
    queryFn: () => postApi.searchHashtags(activeQuery ?? ''),
    enabled: enabled && isTypingHashtag,
    staleTime: 30_000,
  })
}
