const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  token?: string;
}

interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

async function api<T>(endpoint: string, options: ApiOptions = {}): Promise<ApiResponse<T>> {
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
        error: data.error || "An error occurred",
        status: response.status,
      };
    }

    return {
      data,
      status: response.status,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Network error",
      status: 500,
    };
  }
}

// Issue APIs
export const issuesApi = {
  getAll: (params?: {
    status?: string;
    type?: string;
    municipality?: string;
    page?: number;
    limit?: number;
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
    return api<{ issues: unknown[]; pagination: unknown }>(`/issues${query ? `?${query}` : ""}`);
  },

  getById: (id: string) => api<unknown>(`/issues/${id}`),

  getByBounds: (bounds: { north: number; south: number; east: number; west: number }) => {
    const params = new URLSearchParams({
      north: String(bounds.north),
      south: String(bounds.south),
      east: String(bounds.east),
      west: String(bounds.west),
    });
    return api<{ issues: unknown[] }>(`/issues/map?${params}`);
  },

  create: (data: {
    title: string;
    description: string;
    type: string;
    severity: string;
    location: { lat: number; lng: number; address?: string };
    images?: string[];
  }) =>
    api<unknown>("/issues", {
      method: "POST",
      body: data,
    }),

  respond: (
    id: string,
    data: { response: string; status: string; images?: string[] },
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
  getLeaderboard: (params?: { timeRange?: string; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return api<{ leaderboard: unknown[] }>(`/municipalities/leaderboard${query ? `?${query}` : ""}`);
  },

  getById: (id: string) => api<unknown>(`/municipalities/${id}`),

  getStats: (id: string, token: string) =>
    api<unknown>(`/municipalities/${id}/stats`, { token }),
};

// Auth APIs
export const authApi = {
  getProfile: (token: string) =>
    api<unknown>("/auth/profile", { token }),

  updateProfile: (data: { displayName?: string }, token: string) =>
    api<unknown>("/auth/profile", {
      method: "PUT",
      body: data,
      token,
    }),
};

// Health check
export const healthApi = {
  check: () => api<{ status: string; timestamp: string }>("/health"),
};
