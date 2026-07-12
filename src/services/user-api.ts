import { apiRequest, buildQuery } from "./api-client";

export interface SessionUser {
  id: number;
  username: string;
  email: string;
  role: "user" | "admin";
  status: "active" | "suspended";
  displayName: string;
  bio: string;
  avatarUrl: string;
  bannerUrl: string;
  profileVisibility: "public" | "private";
  createdAt: string;
  lastLoginAt: string | null;
}
export interface MediaEntry {
  id: number;
  userId: number;
  mediaType: "movie" | "tv";
  tmdbId: number;
  imdbId: string | null;
  title: string;
  posterUrl: string | null;
  releaseYear: number | null;
  genres?: string[];
  originalLanguage?: string | null;
  originCountry?: string | null;
  watchStatus: "want" | "watching" | "watched" | null;
  favorite: boolean;
  rating: number | null;
  reviewText: string | null;
  containsSpoiler: boolean;
  reviewStatus: "published" | "hidden";
  watchedAt: string | null;
  createdAt: string;
  updatedAt: string;
  likeCount?: number;
  likedByViewer?: boolean;
  user?: { username: string; displayName: string; avatarUrl?: string };
}
export interface ProfileData {
  user: SessionUser;
  stats: Record<string, number>;
  entries: MediaEntry[];
  history?: {
    browse: Array<Record<string, unknown>>;
    search: Array<Record<string, unknown>>;
  };
}
export function userRequest<T>(path: string, options: RequestInit = {}) {
  return apiRequest<T>(path, { ...options, credentials: "include" });
}
export const authApi = {
  me: () => userRequest<{ user: SessionUser | null }>("/api/v1/auth/me"),
  login: (identifier: string, password: string) =>
    userRequest<{ user: SessionUser }>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    }),
  register: (input: {
    username: string;
    email: string;
    password: string;
    displayName: string;
  }) =>
    userRequest<{ user: SessionUser }>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  logout: () =>
    userRequest<{ loggedOut: boolean }>("/api/v1/auth/logout", {
      method: "POST",
    }),
};
export const profileApi = {
  own: () => userRequest<ProfileData>("/api/v1/me/profile"),
  public: (username: string) =>
    userRequest<ProfileData>(`/api/v1/users/${encodeURIComponent(username)}`),
  update: (input: Record<string, unknown>) =>
    userRequest<{ user: SessionUser }>("/api/v1/me/profile", {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  password: (currentPassword: string, nextPassword: string) =>
    userRequest("/api/v1/me/password", {
      method: "PUT",
      body: JSON.stringify({ currentPassword, nextPassword }),
    }),
  history: () =>
    userRequest<{
      browse: Array<Record<string, unknown>>;
      search: Array<Record<string, unknown>>;
    }>("/api/v1/me/history"),
  clearHistory: (type: "browse" | "search") =>
    userRequest(`/api/v1/me/history/${type}`, { method: "DELETE" }),
};
export const mediaApi = {
  get: (type: string, id: number) =>
    userRequest<MediaEntry | null>(`/api/v1/me/media/${type}/${id}`),
  remove: (type: string, id: number) =>
    userRequest(`/api/v1/me/media/${type}/${id}`, { method: "DELETE" }),
  save: (type: string, id: number, input: Record<string, unknown>) =>
    userRequest<MediaEntry>(`/api/v1/me/media/${type}/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  reviews: (type: string, id: number) =>
    userRequest<MediaEntry[]>(`/api/v1/titles/${type}/${id}/reviews`),
  toggleReviewLike: (reviewId: number) =>
    userRequest<{ liked: boolean; likeCount: number }>(
      `/api/v1/reviews/${reviewId}/like`,
      { method: "POST" },
    ),
};
const queryString = (params: Record<string, unknown> = {}) => {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params))
    if (value !== undefined && value !== null && value !== "")
      query.set(key, String(value));
  const result = query.toString();
  return result ? "?" + result : "";
};
export const adminApi = {
  access: () => userRequest<Record<string, any>>("/api/v1/admin/access"),
  overview: () => userRequest<Record<string, any>>("/api/v1/admin/overview"),
  analytics: () => userRequest<Record<string, any>>("/api/v1/admin/analytics"),
  mediaAnalytics: (params: Record<string, unknown> = {}) =>
    userRequest<Record<string, any>>(
      "/api/v1/admin/analytics/media" + queryString(params),
    ),
  users: (params: Record<string, unknown> = {}) =>
    userRequest<Record<string, any>>(
      "/api/v1/admin/users" + queryString(params),
    ),
  user: (id: number) =>
    userRequest<Record<string, any>>(`/api/v1/admin/users/${id}`),
  updateUser: (id: number, input: Record<string, unknown>) =>
    userRequest<Record<string, any>>(`/api/v1/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  bulkUsers: (input: Record<string, unknown>) =>
    userRequest<Record<string, any>>("/api/v1/admin/users/bulk", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  groups: () => userRequest<Record<string, any>>("/api/v1/admin/groups"),
  createGroup: (input: Record<string, unknown>) =>
    userRequest<Record<string, any>>("/api/v1/admin/groups", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateGroup: (id: number, input: Record<string, unknown>) =>
    userRequest<Record<string, any>>(`/api/v1/admin/groups/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  deleteGroup: (id: number) =>
    userRequest<Record<string, any>>(`/api/v1/admin/groups/${id}`, {
      method: "DELETE",
    }),
  setUserAccess: (id: number, input: Record<string, unknown>) =>
    userRequest<Record<string, any>>(`/api/v1/admin/users/${id}/access`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  reviews: (params: Record<string, unknown> = {}) =>
    userRequest<Record<string, any>>(
      "/api/v1/admin/reviews" + queryString(params),
    ),
  moderate: (entryIds: number | number[], status: string) =>
    userRequest<Record<string, any>>("/api/v1/admin/reviews/moderate", {
      method: "POST",
      body: JSON.stringify({
        entryIds: Array.isArray(entryIds) ? entryIds : [entryIds],
        status,
      }),
    }),
  providers: () => userRequest<any[]>("/api/v1/admin/providers"),
  createProvider: (input: Record<string, unknown>) =>
    userRequest<any[]>("/api/v1/admin/providers", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateProvider: (key: string, input: Record<string, unknown>) =>
    userRequest<any[]>(`/api/v1/admin/providers/${encodeURIComponent(key)}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  deleteProvider: (key: string) =>
    userRequest<Record<string, any>>(
      `/api/v1/admin/providers/${encodeURIComponent(key)}`,
      { method: "DELETE" },
    ),
  testProvider: (key: string) =>
    userRequest<Record<string, any>>(
      `/api/v1/admin/providers/${encodeURIComponent(key)}/test`,
      { method: "POST" },
    ),
  cache: (params: Record<string, unknown> = {}) =>
    userRequest<Record<string, any>>(
      "/api/v1/admin/cache" + queryString(params),
    ),
  putCache: (input: Record<string, unknown>) =>
    userRequest<Record<string, any>>("/api/v1/admin/cache", {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  deleteCache: (input: Record<string, unknown>) =>
    userRequest<Record<string, any>>("/api/v1/admin/cache", {
      method: "DELETE",
      body: JSON.stringify(input),
    }),
  logs: (params: Record<string, unknown> = {}) =>
    userRequest<Record<string, any>>(
      "/api/v1/admin/logs" + queryString(params),
    ),
  settings: () => userRequest<any[]>("/api/v1/admin/settings"),
  updateSetting: (key: string, value: unknown) =>
    userRequest<any[]>(`/api/v1/admin/settings/${encodeURIComponent(key)}`, {
      method: "PUT",
      body: JSON.stringify({ value }),
    }),
};
