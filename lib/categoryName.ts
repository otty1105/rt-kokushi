const OLD_NAMES: Record<string, string> = {
  '医療画像情報学': '医用画像情報学',
  '核医学診療技術学': '核医学検査技術学',
  'X線撮影技術学': 'エックス線撮影技術学',
}

export function formatCategory(category: string, year: number): string {
  if (year >= 2025) return category
  const old = OLD_NAMES[category]
  return old ? `${category}（旧：${old}）` : category
}
