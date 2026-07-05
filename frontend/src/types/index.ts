export type User = {
  id: number;
  supabase_id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  salary?: number | null;
};

export type ExpenseCategory = {
  id: number;
  name: string;
  icon: string;
  color: string;
  monthly_budget?: number | null;
  month_spent?: number;
  is_over_budget?: boolean;
};

export type Expense = {
  id: number;
  event_id: number;
  category_id: number | null;
  amount: string;
  payment_method: string;
  merchant: string | null;
  category?: ExpenseCategory;
  event?: EventItem;
};

export type Task = {
  id: number;
  user_id: number;
  event_id: number | null;
  title: string;
  status: "pending" | "done";
  due_at: string | null;
  event?: EventItem;
};

export type EventItem = {
  id: number;
  user_id: number;
  type: string;
  source: string;
  note: string | null;
  occurred_at: string;
  expense?: Expense;
  task?: Task;
};

export type DashboardData = {
  summary: {
    today_expense: number;
    month_expense: number;
    budget: number;
    budget_remaining: number;
    salary?: number | null;
    pending_tasks: number;
    over_budget_categories?: number;
    over_monthly_budget?: boolean;
  };
  widgets: {
    today_expenses: Expense[];
    tasks: Task[];
    recent_events: EventItem[];
    category_spending?: ExpenseCategory[];
  };
};

export type QuickAddPreview = {
  intent: "expense" | "task" | "unknown";
  confidence: number;
  preview: {
    amount?: number;
    merchant?: string;
    category_id?: number;
    category?: ExpenseCategory;
    payment_method?: string;
    title?: string;
    status?: string;
  } | null;
};

export type Paginated<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
};
