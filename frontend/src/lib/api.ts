const CONTENT_API_URL = process.env.NEXT_PUBLIC_CONTENT_API_URL || "http://localhost:8011";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const TOKEN_KEY = "admin_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`;
}

export interface User {
  id: string; username: string; email: string; full_name: string | null;
  is_active: boolean; is_admin: boolean; created_at: string;
}

export interface TokenResponse {
  access_token: string; token_type: string; user: User;
}

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
  try {
    const token = getToken();
    const headers: HeadersInit = { "Content-Type": "application/json", ...options?.headers };
    if (token) (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    const res = await fetch(CONTENT_API_URL + endpoint, { headers, ...options });
    if (!res.ok) throw new Error("API error: " + res.status);
    return await res.json();
  } catch { return null; }
}

async function fetchAPIFormData<T>(endpoint: string, formData: FormData): Promise<T | null> {
  try {
    const token = getToken();
    const headers: HeadersInit = {};
    if (token) (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    const res = await fetch(CONTENT_API_URL + endpoint, { method: "POST", body: formData, headers });
    if (!res.ok) throw new Error("API error: " + res.status);
    return await res.json();
  } catch { return null; }
}

async function fetchAPIGeneric<T>(baseUrl: string, endpoint: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(baseUrl + endpoint, {
      headers: { "Content-Type": "application/json", ...options?.headers },
      ...options,
    });
    if (!res.ok) throw new Error("API error: " + res.status);
    return await res.json();
  } catch { return null; }
}

export interface Service {
  id: string; title: string; slug: string; description: string;
  image_url: string | null; price: number | null; category: string | null;
  is_active: boolean; sort_order: number; created_at: string; updated_at: string;
}
export interface ServiceListResponse { items: Service[]; total: number; page: number; per_page: number; }

export interface FAQ {
  id: string; question: string; answer: string; is_active: boolean;
  sort_order: number; created_at: string; updated_at: string;
}
export interface FAQListResponse { items: FAQ[]; total: number; page: number; per_page: number; }

export interface Review {
  id: string; author: string; service: string; rating: number;
  text: string; is_active: boolean; created_at: string; updated_at: string;
}
export interface ReviewListResponse { items: Review[]; total: number; page: number; per_page: number; }

export interface Media {
  id: string; filename: string; original_name: string; url: string;
  mime_type: string; size: number; alt_text: string | null; created_at: string;
}
export interface MediaListResponse { items: Media[]; total: number; page: number; per_page: number; }

export async function getServices() {
  return fetchAPIGeneric<{ items: unknown[] }>(API_BASE_URL, "/api/v1/catalog/services");
}
export async function getReviews() {
  return fetchAPIGeneric<{ items: unknown[] }>(API_BASE_URL, "/api/v1/reviews");
}
export async function createOrder(data: { name: string; phone: string; service_type: string }) {
  return fetchAPIGeneric<{ id: string }>(API_BASE_URL, "/api/v1/orders", { method: "POST", body: JSON.stringify(data) });
}

export const authApi = {
  login: async (username: string, password: string) => {
    try {
      const res = await fetch(CONTENT_API_URL + "/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Login failed" }));
        throw new Error(err.detail || "Login failed");
      }
      const data: TokenResponse = await res.json();
      setToken(data.access_token);
      return data;
    } catch (e) {
      throw e;
    }
  },
  register: async (username: string, email: string, password: string, fullName?: string) => {
    try {
      const res = await fetch(CONTENT_API_URL + "/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, full_name: fullName }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Registration failed" }));
        throw new Error(err.detail || "Registration failed");
      }
      return await res.json();
    } catch (e) {
      throw e;
    }
  },
  me: async () => {
    try {
      const token = getToken();
      if (!token) return null;
      const res = await fetch(CONTENT_API_URL + "/api/v1/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      return await res.json() as User;
    } catch { return null; }
  },
  logout: () => removeToken(),
};

export const contentApi = {
  services: {
    list: (page = 1, perPage = 20, search?: string, isActive?: boolean) => {
      const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
      if (search) params.append("search", search);
      if (isActive !== undefined) params.append("is_active", String(isActive));
      return fetchAPI<ServiceListResponse>("/api/v1/content/services?" + params);
    },
    get: (id: string) => fetchAPI<Service>("/api/v1/content/services/" + id),
    create: (data: Partial<Service>) => fetchAPI<Service>("/api/v1/content/services", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Service>) => fetchAPI<Service>("/api/v1/content/services/" + id, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) => fetchAPI<null>("/api/v1/content/services/" + id, { method: "DELETE" }),
    reorder: (ids: string[]) => fetchAPI<{ success: boolean }>("/api/v1/content/services/reorder", { method: "POST", body: JSON.stringify({ ids }) }),
  },
  faq: {
    list: (page = 1, perPage = 20, search?: string, isActive?: boolean) => {
      const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
      if (search) params.append("search", search);
      if (isActive !== undefined) params.append("is_active", String(isActive));
      return fetchAPI<FAQListResponse>("/api/v1/content/faq?" + params);
    },
    get: (id: string) => fetchAPI<FAQ>("/api/v1/content/faq/" + id),
    create: (data: Partial<FAQ>) => fetchAPI<FAQ>("/api/v1/content/faq", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<FAQ>) => fetchAPI<FAQ>("/api/v1/content/faq/" + id, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) => fetchAPI<null>("/api/v1/content/faq/" + id, { method: "DELETE" }),
    reorder: (ids: string[]) => fetchAPI<{ success: boolean }>("/api/v1/content/faq/reorder", { method: "POST", body: JSON.stringify({ ids }) }),
  },
  reviews: {
    list: (page = 1, perPage = 20, search?: string, isActive?: boolean) => {
      const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
      if (search) params.append("search", search);
      if (isActive !== undefined) params.append("is_active", String(isActive));
      return fetchAPI<ReviewListResponse>("/api/v1/content/reviews?" + params);
    },
    get: (id: string) => fetchAPI<Review>("/api/v1/content/reviews/" + id),
    create: (data: Partial<Review>) => fetchAPI<Review>("/api/v1/content/reviews", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Review>) => fetchAPI<Review>("/api/v1/content/reviews/" + id, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) => fetchAPI<null>("/api/v1/content/reviews/" + id, { method: "DELETE" }),
    toggle: (id: string) => fetchAPI<Review>("/api/v1/content/reviews/" + id + "/toggle", { method: "PATCH" }),
  },
  media: {
    list: (page = 1, perPage = 20) => fetchAPI<MediaListResponse>("/api/v1/content/media?page=" + page + "&per_page=" + perPage),
    upload: (file: File, altText?: string) => { const fd = new FormData(); fd.append("file", file); if (altText) fd.append("alt_text", altText); return fetchAPIFormData<Media>("/api/v1/content/media/upload", fd); },
    delete: (id: string) => fetchAPI<null>("/api/v1/content/media/" + id, { method: "DELETE" }),
  },
};
