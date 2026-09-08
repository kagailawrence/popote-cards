export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (typeof window !== 'undefined' ? '/api/v1' : '/api/v1')

export const STORAGE_BASE_URL =
  process.env.NEXT_PUBLIC_STORAGE_URL ||
  (typeof window !== 'undefined' ? '/storage' : '/storage')

export async function fetchApi<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || 'API Request failed')
  }

  return data.data !== undefined ? data.data : data
}
