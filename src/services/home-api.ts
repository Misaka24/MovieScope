import type { HomeData } from '../types/media'

interface ApiResponse<T> {
  data: T | null
  error: { code: string; message: string } | null
}

export async function fetchHomeData(): Promise<HomeData> {
  let response: Response
  try {
    response = await fetch('/api/v1/home', { headers: { Accept: 'application/json' } })
  } catch {
    throw new Error('API 服务未启动或网络不可用，请启动后端服务后重试')
  }
  const rawBody = await response.text()
  if ([502, 503, 504].includes(response.status)) throw new Error('API 服务未启动或暂时不可用，请稍后重试')
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
