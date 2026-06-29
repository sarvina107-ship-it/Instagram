import type { HashtagSuggestion } from '../lib/hashtagUtils'
import {
  formatPostsCount,
  getPostsCountLabel,
} from '../lib/hashtagUtils'

type HashtagSuggestionsListProps = {
  suggestions: HashtagSuggestion[]
  isLoading?: boolean
  onSelect: (tag: string) => void
  className?: string
}

export const HashtagSuggestionsList = ({
  suggestions,
  isLoading = false,
  onSelect,
  className = '',
}: HashtagSuggestionsListProps) => {
  if (isLoading) {
    return (
      <div className={`py-3 text-center text-[14px] text-[#8e8e8e] ${className}`}>
        Загрузка...
      </div>
    )
  }

  if (!suggestions.length) return null

  return (
    <div className={`overflow-y-auto ${className}`}>
      {suggestions.map((item) => (
        <button
          key={item.tag}
          type="button"
          onClick={() => onSelect(item.tag)}
          className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-[#fafafa]"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#dbdbdb] bg-[#fafafa] text-[18px] font-light text-[#8e8e8e]">
            #
          </div>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold text-black">
              #{item.tag}
            </p>
            <p className="truncate text-[14px] text-[#8e8e8e]">
              {formatPostsCount(item.postsCount)} {getPostsCountLabel(item.postsCount)}
            </p>
          </div>
        </button>
      ))}
    </div>
  )
}
