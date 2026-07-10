export function formatCount(value: number | null | undefined) {
  if (value == null) return '暂无'
  return new Intl.NumberFormat('zh-CN', { notation: value >= 10000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(value)
}
export function formatDate(value: string | null | undefined) {
  if (!value) return '暂无'
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(value))
}
export function formatRuntime(minutes: number | null | undefined) {
  if (!minutes) return '时长暂无'
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return hours ? `${hours}小时${rest ? `${rest}分钟` : ''}` : `${rest}分钟`
}
export function formatMoney(value: number | null | undefined) {
  if (!value) return '暂无'
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(value)
}
