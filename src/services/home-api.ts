import type { HomeData } from '../types/media'

interface ApiResponse<T> {
  data: T | null
  error: { code: string; message: string } | null
}

export async function fetchHomeData(): Promise<HomeData> {
  const response = await fetch('/api/v1/home', { headers: { Accept: 'application/json' } })
  const body = await response.json() as ApiResponse<HomeData>
  if (!response.ok || !body.data) throw new Error(body.error?.message || '首页数据加载失败')
  return body.data
}