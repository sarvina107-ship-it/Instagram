export interface HashtagSuggestion {
  tag: string
  postsCount: number
}

export const getActiveHashtagQuery = (
  text: string,
  cursorPosition: number
): string | null => {
  const beforeCursor = text.slice(0, cursorPosition)
  const match = beforeCursor.match(/#([\p{L}0-9_]*)$/u)
  if (!match) return null
  return match[1]
}

export const insertHashtagIntoCaption = (
  caption: string,
  cursorPosition: number,
  tag: string
) => {
  const beforeCursor = caption.slice(0, cursorPosition)
  const afterCursor = caption.slice(cursorPosition)
  const match = beforeCursor.match(/#([\p{L}0-9_]*)$/u)

  if (!match) {
    return { caption, cursorPosition }
  }

  const hashtagStart = beforeCursor.length - match[0].length
  const nextCaption = `${caption.slice(0, hashtagStart)}#${tag} ${afterCursor}`
  const nextCursor = hashtagStart + tag.length + 2

  return {
    caption: nextCaption.slice(0, 2200),
    cursorPosition: Math.min(nextCursor, 2200),
  }
}

export const formatPostsCount = (count: number) => {
  if (count >= 1_000_000_000) {
    const value = count / 1_000_000_000
    return `${value % 1 === 0 ? value.toFixed(0) : value.toFixed(1).replace('.0', '')} млрд`
  }

  if (count >= 1_000_000) {
    const value = count / 1_000_000
    return `${value % 1 === 0 ? value.toFixed(0) : value.toFixed(1).replace('.0', '')} млн`
  }

  if (count >= 10_000) {
    const value = count / 1_000
    return `${value % 1 === 0 ? value.toFixed(0) : value.toFixed(1).replace('.0', '')} тыс`
  }

  return count.toLocaleString('ru-RU')
}

export const getPostsCountLabel = (count: number) => {
  const mod10 = count % 10
  const mod100 = count % 100

  if (mod10 === 1 && mod100 !== 11) return 'публикация'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    return 'публикации'
  }

  return 'публикаций'
}
