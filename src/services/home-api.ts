import type { HomeData } from '../types/media'

interface ApiResponse<T> {
  data: T | null
  error: { code: string; message: string } | null
}

export async function fetchHomeData(): Promise<HomeData> {
  const response = await fetch('/api/v1/home', { headers: { Accept: 'application/json' } })
  const rawBody = await response.text()
  if (!rawBody.trim()) throw new Error(response.ok ? '服务器返回了空响应' : `服务器请求失败（${response.status}）`)
  let body: ApiResponse<HomeData>
  try {
    body = JSON.parse(rawBody) as ApiResponse<HomeData>
  } catch {
    throw new Error('服务器返回的数据格式无效')
  }
  if (!response.ok || !body.data) throw new Error(body.error?.message || '首页数据加载失败')
  return body.data
}
