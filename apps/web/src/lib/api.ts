const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  token?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string | null;
  timestamp: string;
}

async function api<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<ApiResponse<T>> {
  const { method = "GET", body, headers = {}, token } = options;

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (token) {
    requestHeaders["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || "An error occurred",
        timestamp: new Date().toISOString(),
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
      timestamp: new Date().toISOString(),
    };
  }
}

// Issue APIs
export const issuesApi = {
  getAll: (params?: {
    status?: string[];
    type?: string[];
    municipalityId?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      if (params.status) {
        params.status.forEach((s) => searchParams.append("status", s));
      }
      if (params.type) {
        params.type.forEach((t) => searchParams.append("type", t));
      }
      if (params.municipalityId) {
        searchParams.append("municipalityId", params.municipalityId);
      }
      if (params.page) {
        searchParams.append("page", String(params.page));
      }
      if (params.pageSize) {
        searchParams.append("pageSize", String(params.pageSize));
      }
    }
    const query = searchParams.toString();
    return api<{
      items: unknown[];
      total: number;
      page: number;
      pageSize: number;
      hasMore: boolean;
    }>(`/issues${query ? `?${query}` : ""}`);
  },

  getById: (id: string) => api<unknown>(`/issues/${id}`),

  getStats: () =>
    api<{
      totalIssues: number;
      resolvedIssues: number;
      openIssues: number;
      totalMunicipalities: number;
      avgResponseTime: number;
    }>("/issues/stats"),

  getByBounds: (bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }) => {
    const params = new URLSearchParams({
      north: String(bounds.north),
      south: String(bounds.south),
      east: String(bounds.east),
      west: String(bounds.west),
    });
    return api<unknown[]>(`/issues/map/bounds?${params}`);
  },

  create: (data: {
    description: string;
    type?: string;
    location: { latitude: number; longitude: number };
    imageUrl?: string;
  }) =>
    api<unknown>("/issues", {
      method: "POST",
      body: data,
    }),

  respond: (
    id: string,
    data: { resolutionNote: string; resolutionImageUrl?: string },
    token: string
  ) =>
    api<unknown>(`/issues/${id}/respond`, {
      method: "POST",
      body: data,
      token,
    }),
};

// Municipality APIs
export const municipalitiesApi = {
  getAll: (params?: {
    state?: string;
    district?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return api<{
      items: unknown[];
      total: number;
      page: number;
      pageSize: number;
      hasMore: boolean;
    }>(`/municipalities${query ? `?${query}` : ""}`);
  },

  getLeaderboard: (params?: { page?: number; pageSize?: number }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return api<{
      entries: unknown[];
      lastUpdated: string;
      totalMunicipalities: number;
    }>(`/municipalities/leaderboard${query ? `?${query}` : ""}`);
  },

  getById: (id: string) => api<unknown>(`/municipalities/${id}`),

  getStats: (id: string) => api<unknown>(`/municipalities/${id}/stats`),

  // Submit municipality registration request
  submitRegistration: (data: {
    name: string;
    email: string;
    phone: string;
    municipalityName: string;
    municipalityType: string;
    state: string;
    district: string;
    address: string;
    population?: number;
    registrationNumber: string;
  }, token: string) =>
    api<unknown>("/municipalities/register", {
      method: "POST",
      body: data,
      token,
    }),
};

// Auth APIs
export const authApi = {
  getMe: (token: string) => api<unknown>("/auth/me", { token }),

  verify: (token: string) =>
    api<unknown>("/auth/verify", {
      method: "POST",
      token,
    }),

  login: (token: string) =>
    api<unknown>("/auth/login", {
      method: "POST",
      token,
    }),
};

// Health check
export const healthApi = {
  check: () => api<{ status: string; timestamp: string }>("/health"),
};
