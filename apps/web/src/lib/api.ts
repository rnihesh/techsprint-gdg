import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("civicsense_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("civicsense_token");
        // Redirect to login if on protected route
        if (window.location.pathname.startsWith("/municipality")) {
          window.location.href = "/municipality/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

// Issue APIs
export const issueApi = {
  submit: async (formData: FormData) => {
    const response = await api.post("/issues", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  list: async (params?: Record<string, string>) => {
    const response = await api.get("/issues", { params });
    return response.data;
  },

  getAll: async (params?: Record<string, string>) => {
    const response = await api.get("/issues", { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/issues/${id}`);
    return response.data;
  },

  getMapData: async (params?: Record<string, string>) => {
    const response = await api.get("/issues/map", { params });
    return response.data;
  },

  getHeatmapData: async (params?: Record<string, string>) => {
    const response = await api.get("/issues/heatmap", { params });
    return response.data;
  },

  getStats: async () => {
    const response = await api.get("/issues/stats/overview");
    return response.data;
  },
};

// Leaderboard APIs
export const leaderboardApi = {
  getAll: async (params?: Record<string, string>) => {
    const response = await api.get("/leaderboard", { params });
    return response.data;
  },

  getTop: async () => {
    const response = await api.get("/leaderboard/top");
    return response.data;
  },

  getBottom: async () => {
    const response = await api.get("/leaderboard/bottom");
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/leaderboard/${id}`);
    return response.data;
  },

  getByState: async (state: string) => {
    const response = await api.get(`/leaderboard/state/${state}`);
    return response.data;
  },
};

// Municipality APIs (authenticated)
export const municipalityApi = {
  login: async (email: string, password: string) => {
    const response = await api.post("/municipality/login", { email, password });
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get("/municipality/profile");
    return response.data;
  },

  getIssues: async (params?: Record<string, string>) => {
    const response = await api.get("/municipality/issues", { params });
    return response.data;
  },

  getIssueById: async (id: string) => {
    const response = await api.get(`/municipality/issues/${id}`);
    return response.data;
  },

  getIssueDetails: async (id: string) => {
    const response = await api.get(`/municipality/issues/${id}`);
    return response.data;
  },

  respondToIssue: async (issueId: string, formData: FormData) => {
    const response = await api.post(
      `/municipality/issues/${issueId}/respond`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return response.data;
  },

  getStats: async () => {
    const response = await api.get("/municipality/stats");
    return response.data;
  },
};

// Meta APIs
export const metaApi = {
  getMunicipalities: async (params?: Record<string, string>) => {
    const response = await api.get("/municipalities", { params });
    return response.data;
  },

  getStates: async () => {
    const response = await api.get("/municipalities/states");
    return response.data;
  },

  getDistricts: async (state: string) => {
    const response = await api.get(`/municipalities/districts/${state}`);
    return response.data;
  },

  getIssueTypes: async () => {
    const response = await api.get("/issue-types");
    return response.data;
  },
};
