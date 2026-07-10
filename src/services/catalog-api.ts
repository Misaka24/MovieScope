import type { BrowseData, DiscoverData, NewsItem, PeoplePageData, PersonDetails, SearchData, TitleDetails, WatchProvider } from '../types/catalog'

interface ApiResponse<T> { data: T | null; error: { code: string; message: string } | null }

async function request<T>(path: string): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, { headers: { Accept: 'application/json' } })
  } catch {
    throw new Error('API 服务未启动或网络不可用')
  }
  const text = await response.text()
  if (!text.trim()) throw new Error(`服务器返回空响应（${response.status}）`)
  let body: ApiResponse<T>
  try { body = JSON.parse(text) as ApiResponse<T> } catch { throw new Error('服务器返回的数据格式无效') }
  if (!response.ok || !body.data) throw new Error(body.error?.message || '数据加载失败')
  return body.data
}

function queryString(params: Record<string, string | number | null | undefined>) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) if (value !== undefined && value !== null && value !== '') query.set(key, String(value))
  return query.toString()
}

export const fetchSearch = (params: Record<string, string | number | null | undefined>) => request<SearchData>(`/api/v1/search?${queryString(params)}`)
export const fetchDiscover = (params: Record<string, string | number | null | undefined>) => request<DiscoverData>(`/api/v1/discover?${queryString(params)}`)
export const fetchTitle = (type: string, id: string | number) => request<TitleDetails>(`/api/v1/titles/${type}/${id}`)
export const fetchPerson = (id: string | number) => request<PersonDetails>(`/api/v1/people/${id}`)
export const fetchBrowse = (preset: string, page: number) => request<BrowseData>(`/api/v1/browse?${queryString({ preset, page })}`)
export const fetchPopularPeople = (page: number, department?: string) => request<PeoplePageData>(`/api/v1/people/popular?${queryString({ page, department })}`)
export const fetchWatchProviders = () => request<WatchProvider[]>('/api/v1/watch-providers')
export const fetchNews = () => request<NewsItem[]>('/api/v1/news')
