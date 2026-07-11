import type { BrowseData, DiscoverData, ExternalReviewsData, NewsItem, PeoplePageData, PersonDetails, SearchData, TitleDetails, WatchProvider } from '../types/catalog'
import { apiRequest, buildQuery } from './api-client'

const request = <T>(path: string) => apiRequest<T>(path, { fallbackErrorMessage: '数据加载失败' })

export const fetchSearch = (params: Record<string, string | number | null | undefined>) => request<SearchData>(`/api/v1/search${buildQuery(params)}`)
export const fetchDiscover = (params: Record<string, string | number | null | undefined>) => request<DiscoverData>(`/api/v1/discover${buildQuery(params)}`)
export const fetchTitle = (type: string, id: string | number) => request<TitleDetails>(`/api/v1/titles/${type}/${id}`)
export const fetchPerson = (id: string | number) => request<PersonDetails>(`/api/v1/people/${id}`)
export const fetchBrowse = (preset: string, page: number) => request<BrowseData>(`/api/v1/browse${buildQuery({ preset, page })}`)
export const fetchPopularPeople = (page: number, department?: string) => request<PeoplePageData>(`/api/v1/people/popular${buildQuery({ page, department })}`)
export const fetchWatchProviders = () => request<WatchProvider[]>('/api/v1/watch-providers')
export const fetchNews = () => request<NewsItem[]>('/api/v1/news')

export const fetchExternalReviews = (type: string, id: string | number) => request<ExternalReviewsData>(`/api/v1/titles/${type}/${id}/external-reviews`)
export const fetchDoubanReviewDetail = (reviewId: string) => request<{ id: string; content: string | null; forwardCount: number; collectCount: number; replyCount: number }>(`/api/v1/douban/reviews/${reviewId}`)
