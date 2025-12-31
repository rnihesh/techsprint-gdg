import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  email: string;
  name: string;
  designation?: string;
  role?: string;
}

interface Municipality {
  _id: string;
  name: string;
  type: string;
  district: string;
  state: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  municipality: Municipality | null;
  isAuthenticated: boolean;
  login: (token: string, user: User, municipality: Municipality) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      municipality: null,
      isAuthenticated: false,
      login: (token, user, municipality) => {
        localStorage.setItem("civicsense_token", token);
        set({
          token,
          user,
          municipality,
          isAuthenticated: true,
        });
      },
      logout: () => {
        localStorage.removeItem("civicsense_token");
        set({
          token: null,
          user: null,
          municipality: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: "civicsense-auth",
    }
  )
);

interface FilterState {
  status: string;
  issueType: string;
  state: string;
  district: string;
  dateRange: { start: string; end: string } | null;
  setFilter: (key: string, value: string) => void;
  setDateRange: (range: { start: string; end: string } | null) => void;
  clearFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  status: "",
  issueType: "",
  state: "",
  district: "",
  dateRange: null,
  setFilter: (key, value) => set((state) => ({ ...state, [key]: value })),
  setDateRange: (range) => set({ dateRange: range }),
  clearFilters: () =>
    set({
      status: "",
      issueType: "",
      state: "",
      district: "",
      dateRange: null,
    }),
}));
