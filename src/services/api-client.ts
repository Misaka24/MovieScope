export interface ApiEnvelope<T> {
  data: T | null
  error: { code: string; message: string } | null
}

interface ApiRequestOptions extends RequestInit {
  networkErrorMessage?: string
  emptyResponseMessage?: string | ((response: Response) => string)
  fallbackErrorMessage?: string
  statusErrorMessage?: (response: Response) => string | null
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const {
    networkErrorMessage = 'API 服务未启动或网络不可用',
    emptyResponseMessage,
    fallbackErrorMessage = '请求失败',
    statusErrorMessage,
    ...requestOptions
  } = options
  let response: Response
  try {
    response = await fetch(path, {
      ...requestOptions,
      headers: {
        Accept: 'application/json',
        ...(requestOptions.body ? { 'Content-Type': 'application/json' } : {}),
        ...requestOptions.headers,
      },
    })
  } catch {
    throw new Error(networkErrorMessage)
  }
  const statusMessage = statusErrorMessage?.(response)
  if (statusMessage) throw new Error(statusMessage)
  const text = await response.text()
  if (!text.trim()) {
    const message = typeof emptyResponseMessage === 'function'
      ? emptyResponseMessage(response)
      : emptyResponseMessage || `服务器返回空响应（${response.status}）`
    throw new Error(message)
  }
  let body: ApiEnvelope<T>
  try {
    body = JSON.parse(text) as ApiEnvelope<T>
  } catch {
    throw new Error('服务器返回的数据格式无效')
  }
  if (!response.ok || body.data == null) throw new Error(body.error?.message || fallbackErrorMessage)
  return body.data
}

export function buildQuery(params: Record<string, unknown>): string {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value))
  }
  const result = query.toString()
  return result ? `?${result}` : ''
}
