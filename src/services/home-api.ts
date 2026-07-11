import type { HomeData } from '../types/media'
import { apiRequest } from './api-client'

export function fetchHomeData(): Promise<HomeData> {
  return apiRequest<HomeData>('/api/v1/home', {
    networkErrorMessage: 'API 服务未启动或网络不可用，请启动后端服务后重试',
    statusErrorMessage: (response) => [502, 503, 504].includes(response.status)
      ? 'API 服务未启动或暂时不可用，请稍后重试'
      : null,
    emptyResponseMessage: (response) => response.ok
      ? '服务器返回了空响应'
      : `服务器请求失败（${response.status}）`,
    fallbackErrorMessage: '首页数据加载失败',
  })
}
