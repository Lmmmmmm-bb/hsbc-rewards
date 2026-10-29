export function resultPage<T>(entries: readonly T[], page: number) {
  const pages = Math.max(1, Math.ceil(entries.length / 20))
  const current = Math.max(0, Math.min(page, pages - 1))
  return {
    entries: entries.slice(current * 20, current * 20 + 20),
    count: entries.length,
    pages,
    current,
  }
}
