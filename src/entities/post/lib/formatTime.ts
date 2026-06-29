export const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString)
  const diffMs = Date.now() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)

  if (diffMinutes < 1) return 'только что'
  if (diffMinutes < 60) return `${diffMinutes} мин.`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} ч.`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays} дн.`

  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
  })
}

export const formatRelativeTimeLong = (dateString: string) => {
  const date = new Date(dateString)
  const diffMs = Date.now() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)

  if (diffMinutes < 1) return 'только что'
  if (diffMinutes < 60) {
    const word = diffMinutes === 1 ? 'минуту' : diffMinutes < 5 ? 'минуты' : 'минут'
    return `${diffMinutes} ${word} назад`
  }

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) {
    const word = diffHours === 1 ? 'час' : diffHours < 5 ? 'часа' : 'часов'
    return `${diffHours} ${word} назад`
  }

  const diffDays = Math.floor(diffHours / 24)
  const word = diffDays === 1 ? 'день' : diffDays < 5 ? 'дня' : 'дней'
  return `${diffDays} ${word} назад`
}
