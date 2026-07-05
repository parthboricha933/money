import { create } from "zustand";

export type Category = "Food" | "Transport" | "Shopping" | "Bills" | "Entertainment" | "Education" | "Health" | "Others";

export const CATEGORIES: Category[] = [
  "Food", "Transport", "Shopping", "Bills", "Entertainment", "Education", "Health", "Others"
];

export const CATEGORY_COLORS: Record<Category, string> = {
  Food: "#f97316",
  Transport: "#3b82f6",
  Shopping: "#ec4899",
  Bills: "#8b5cf6",
  Entertainment: "#f59e0b",
  Education: "#10b981",
  Health: "#ef4444",
  Others: "#6b7280",
};

export const CATEGORY_ICONS: Record<Category, string> = {
  Food: "🍔",
  Transport: "🚗",
  Shopping: "🛍️",
  Bills: "📄",
  Entertainment: "🎬",
  Education: "📚",
  Health: "❤️",
  Others: "📦",
};

export interface Expense {
  id: string;
  amount: number;
  category: Category;
  note: string;
  date: string;
  createdAt: string;
}

export interface BudgetData {
  id: string;
  amount: number;
  month: number;
  year: number;
}

export interface NotificationData {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export type ViewTab = "dashboard" | "expenses" | "analytics" | "calendar" | "history" | "insights";

interface AppState {
  // Auth
  isAuthenticated: boolean;
  isLoading: boolean;
  user: { id: string; email: string; name: string } | null;

  // Data
  budget: BudgetData | null;
  expenses: Expense[];
  notifications: NotificationData[];
  analytics: {
    budget: number;
    totalSpent: number;
    remaining: number;
    categoryBreakdown: Record<string, number>;
    dailySpending: { day: number; amount: number }[];
    weeklySpending: { week: string; amount: number }[];
  } | null;

  // UI
  currentTab: ViewTab;
  selectedMonth: number;
  selectedYear: number;
  showAddExpense: boolean;
  editingExpense: Expense | null;
  searchQuery: string;
  filterCategory: string;

  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setBudget: (amount: number, month?: number, year?: number) => Promise<void>;
  fetchBudget: (month?: number, year?: number) => Promise<void>;
  fetchExpenses: (month?: number, year?: number) => Promise<void>;
  addExpense: (expense: { amount: number; category: Category; note: string; date: string }) => Promise<boolean>;
  updateExpense: (id: string, data: Partial<Expense>) => Promise<boolean>;
  deleteExpense: (id: string) => Promise<boolean>;
  fetchAnalytics: (month?: number, year?: number) => Promise<void>;
  fetchNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  setCurrentTab: (tab: ViewTab) => void;
  setSelectedMonth: (month: number) => void;
  setSelectedYear: (year: number) => void;
  setShowAddExpense: (show: boolean) => void;
  setEditingExpense: (expense: Expense | null) => void;
  setSearchQuery: (query: string) => void;
  setFilterCategory: (category: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  budget: null,
  expenses: [],
  notifications: [],
  analytics: null,
  currentTab: "dashboard",
  selectedMonth: new Date().getMonth() + 1,
  selectedYear: new Date().getFullYear(),
  showAddExpense: false,
  editingExpense: null,
  searchQuery: "",
  filterCategory: "all",

  login: async (email, password) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      set({ isAuthenticated: true, user: { id: data.user?.id || "", email, name: data.user?.name || email } });
      return true;
    } catch {
      return false;
    }
  },

  signup: async (email, password, name) => {
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      if (!res.ok) return false;
      return true;
    } catch {
      return false;
    }
  },

  logout: async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      set({
        isAuthenticated: false,
        user: null,
        budget: null,
        expenses: [],
        notifications: [],
        analytics: null,
      });
    }
  },

  checkAuth: async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data?.user) {
        set({ isAuthenticated: true, user: { id: data.user.id, email: data.user.email, name: data.user.name || "" }, isLoading: false });
      } else {
        set({ isAuthenticated: false, user: null, isLoading: false });
      }
    } catch {
      set({ isAuthenticated: false, user: null, isLoading: false });
    }
  },

  setBudget: async (amount, month, year) => {
    const { selectedMonth, selectedYear } = get();
    const m = month || selectedMonth;
    const y = year || selectedYear;
    try {
      const res = await fetch("/api/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, month: m, year: y }),
      });
      if (res.ok) {
        const budget = await res.json();
        set({ budget });
      }
    } catch (error) {
      console.error("Set budget error:", error);
    }
  },

  fetchBudget: async (month, year) => {
    const { selectedMonth, selectedYear } = get();
    const m = month || selectedMonth;
    const y = year || selectedYear;
    try {
      const res = await fetch(`/api/budget?month=${m}&year=${y}`);
      if (res.ok) {
        const budgets = await res.json();
        const current = budgets.find((b: BudgetData) => b.month === m && b.year === y);
        set({ budget: current || null });
      }
    } catch (error) {
      console.error("Fetch budget error:", error);
    }
  },

  fetchExpenses: async (month, year) => {
    const { selectedMonth, selectedYear } = get();
    const m = month || selectedMonth;
    const y = year || selectedYear;
    try {
      const res = await fetch(`/api/expense?month=${m}&year=${y}`);
      if (res.ok) {
        const expenses = await res.json();
        set({ expenses });
      }
    } catch (error) {
      console.error("Fetch expenses error:", error);
    }
  },

  addExpense: async (expense) => {
    try {
      const res = await fetch("/api/expense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expense),
      });
      if (res.ok) {
        await get().fetchExpenses();
        await get().fetchAnalytics();
        await get().fetchNotifications();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  updateExpense: async (id, data) => {
    try {
      const res = await fetch(`/api/expense/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        await get().fetchExpenses();
        await get().fetchAnalytics();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  deleteExpense: async (id) => {
    try {
      const res = await fetch(`/api/expense/${id}`, { method: "DELETE" });
      if (res.ok) {
        await get().fetchExpenses();
        await get().fetchAnalytics();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  fetchAnalytics: async (month, year) => {
    const { selectedMonth, selectedYear } = get();
    const m = month || selectedMonth;
    const y = year || selectedYear;
    try {
      const res = await fetch(`/api/analytics?month=${m}&year=${y}`);
      if (res.ok) {
        const analytics = await res.json();
        set({ analytics });
      }
    } catch (error) {
      console.error("Fetch analytics error:", error);
    }
  },

  fetchNotifications: async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const notifications = await res.json();
        set({ notifications });
      }
    } catch (error) {
      console.error("Fetch notifications error:", error);
    }
  },

  markNotificationRead: async (id) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: "PUT" });
      if (res.ok) {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));
      }
    } catch (error) {
      console.error("Mark notification error:", error);
    }
  },

  setCurrentTab: (tab) => set({ currentTab: tab }),
  setSelectedMonth: (month) => set({ selectedMonth: month }),
  setSelectedYear: (year) => set({ selectedYear: year }),
  setShowAddExpense: (show) => set({ showAddExpense: show }),
  setEditingExpense: (expense) => set({ editingExpense: expense }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilterCategory: (category) => set({ filterCategory: category }),
}));
