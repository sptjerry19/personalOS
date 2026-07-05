import { createClient } from "@/lib/supabase/client";
import { apiPath } from "@/lib/api-base";
import type {
  DashboardData,
  Expense,
  ExpenseCategory,
  Paginated,
  QuickAddPreview,
  Task,
  User,
} from "@/types";

async function getToken(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();

  const response = await fetch(apiPath(path), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const validationErrors = error.errors
      ? Object.values(error.errors as Record<string, string[]>).flat().join(", ")
      : null;
    throw new Error(
      validationErrors ?? error.message ?? `API error ${response.status}`
    );
  }

  return response.json();
}

export const api = {
  getUser: () => apiFetch<User>("/user"),
  getDashboard: () => apiFetch<DashboardData>("/dashboard"),
  previewQuickAdd: (input: string) =>
    apiFetch<QuickAddPreview>("/quick-add/preview", {
      method: "POST",
      body: JSON.stringify({ input }),
    }),
  saveQuickAdd: (
    input: string,
    payload?: {
      intent?: string;
      preview?: Record<string, unknown>;
      override?: Record<string, unknown>;
    }
  ) =>
    apiFetch("/quick-add", {
      method: "POST",
      body: JSON.stringify({
        input,
        intent: payload?.intent,
        preview: payload?.preview,
        override: payload?.override,
      }),
    }),
  getExpenses: (
    page = 1,
    filters?: { categoryId?: number; uncategorized?: boolean }
  ) => {
    const params = new URLSearchParams({ page: String(page) });
    if (filters?.categoryId != null) {
      params.set("category_id", String(filters.categoryId));
    }
    if (filters?.uncategorized) {
      params.set("uncategorized", "1");
    }
    return apiFetch<Paginated<Expense>>(`/expenses?${params}`);
  },
  getCategories: () => apiFetch<ExpenseCategory[]>("/categories"),
  createCategory: (data: { name: string; icon?: string; color?: string }) =>
    apiFetch<ExpenseCategory>("/categories", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateCategoryBudget: (categoryId: number, monthlyBudget: number | null) =>
    apiFetch<ExpenseCategory>(`/categories/${categoryId}/budget`, {
      method: "PUT",
      body: JSON.stringify({ monthly_budget: monthlyBudget }),
    }),
  createExpense: (data: Record<string, unknown>) =>
    apiFetch<Expense>("/expenses", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateExpense: (id: number, data: Record<string, unknown>) =>
    apiFetch<Expense>(`/expenses/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteExpense: (id: number) =>
    apiFetch(`/expenses/${id}`, { method: "DELETE" }),
  getTasks: (status?: string) =>
    apiFetch<Paginated<Task>>(
      `/tasks${status ? `?status=${status}` : ""}`
    ),
  createTask: (data: Record<string, unknown>) =>
    apiFetch<Task>("/tasks", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateTask: (id: number, data: Record<string, unknown>) =>
    apiFetch<Task>(`/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteTask: (id: number) =>
    apiFetch(`/tasks/${id}`, { method: "DELETE" }),
};
