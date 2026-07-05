import { query, table } from "@/lib/server/db";
import type { DbUser } from "@/lib/server/auth";
import { monthSpendingByCategory } from "@/lib/server/services/categories";
import { mapExpenseRow } from "@/lib/server/services/quick-add";
import type { DashboardData } from "@/types";

function todayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

function monthStartIso(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

export async function getDashboardForUser(user: DbUser): Promise<DashboardData> {
  const expensesTable = table("expenses");
  const eventsTable = table("events");
  const tasksTable = table("tasks");
  const categoriesTable = table("expense_categories");
  const { start: todayStart, end: todayEnd } = todayRange();
  const monthStart = monthStartIso();

  const todayExpenseResult = await query<{ total: string }>(
    `SELECT COALESCE(SUM(e.amount), 0) AS total
     FROM ${expensesTable} e
     JOIN ${eventsTable} ev ON ev.id = e.event_id
     WHERE ev.user_id = $1
       AND ev.occurred_at >= $2
       AND ev.occurred_at <= $3`,
    [user.id, todayStart, todayEnd]
  );

  const monthExpenseResult = await query<{ total: string }>(
    `SELECT COALESCE(SUM(e.amount), 0) AS total
     FROM ${expensesTable} e
     JOIN ${eventsTable} ev ON ev.id = e.event_id
     WHERE ev.user_id = $1 AND ev.occurred_at >= $2`,
    [user.id, monthStart]
  );

  const pendingTasksResult = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM ${tasksTable}
     WHERE user_id = $1 AND status = 'pending'`,
    [user.id]
  );

  const recentEventsResult = await query(
    `SELECT ev.*,
            e.id AS expense_id, e.amount, e.merchant, e.payment_method, e.category_id,
            c.id AS cat_id, c.name AS cat_name, c.icon AS cat_icon, c.color AS cat_color,
            t.id AS task_id, t.title AS task_title, t.status AS task_status, t.due_at AS task_due_at
     FROM ${eventsTable} ev
     LEFT JOIN ${expensesTable} e ON e.event_id = ev.id
     LEFT JOIN ${categoriesTable} c ON c.id = e.category_id
     LEFT JOIN ${tasksTable} t ON t.event_id = ev.id
     WHERE ev.user_id = $1
     ORDER BY ev.occurred_at DESC
     LIMIT 8`,
    [user.id]
  );

  const todayExpensesResult = await query(
    `SELECT e.*,
            ev.id AS ev_id, ev.user_id AS ev_user_id, ev.type AS ev_type,
            ev.source AS ev_source, ev.note AS ev_note, ev.occurred_at AS ev_occurred_at,
            c.id AS cat_id, c.name AS cat_name, c.icon AS cat_icon, c.color AS cat_color
     FROM ${expensesTable} e
     JOIN ${eventsTable} ev ON ev.id = e.event_id
     LEFT JOIN ${categoriesTable} c ON c.id = e.category_id
     WHERE ev.user_id = $1
       AND ev.occurred_at >= $2
       AND ev.occurred_at <= $3
     ORDER BY e.created_at DESC
     LIMIT 5`,
    [user.id, todayStart, todayEnd]
  );

  const upcomingTasksResult = await query(
    `SELECT t.*,
            ev.id AS ev_id, ev.type AS ev_type, ev.source AS ev_source,
            ev.note AS ev_note, ev.occurred_at AS ev_occurred_at
     FROM ${tasksTable} t
     LEFT JOIN ${eventsTable} ev ON ev.id = t.event_id
     WHERE t.user_id = $1 AND t.status = 'pending'
     ORDER BY t.due_at IS NULL, t.due_at ASC
     LIMIT 5`,
    [user.id]
  );

  const categorySpending = await monthSpendingByCategory(user);
  const monthExpense = parseFloat(monthExpenseResult.rows[0]?.total ?? "0");
  const budget = user.salary ?? 0;
  const overBudgetCount = categorySpending.filter((c) => c.is_over_budget).length;
  const overMonthlyBudget = budget > 0 && monthExpense > budget;

  return {
    summary: {
      today_expense: parseFloat(todayExpenseResult.rows[0]?.total ?? "0"),
      month_expense: monthExpense,
      budget,
      budget_remaining: Math.max(0, budget - monthExpense),
      salary: budget,
      pending_tasks: parseInt(pendingTasksResult.rows[0]?.count ?? "0", 10),
      over_budget_categories: overBudgetCount,
      over_monthly_budget: overMonthlyBudget,
    },
    widgets: {
      today_expenses: todayExpensesResult.rows.map(mapExpenseRow),
      tasks: upcomingTasksResult.rows.map((row) => ({
        id: Number(row.id),
        user_id: Number(row.user_id),
        event_id: row.event_id != null ? Number(row.event_id) : null,
        title: String(row.title),
        status: row.status as "pending" | "done",
        due_at: row.due_at != null ? String(row.due_at) : null,
        event: row.ev_id
          ? {
              id: Number(row.ev_id),
              user_id: Number(row.user_id),
              type: String(row.ev_type),
              source: String(row.ev_source),
              note: row.ev_note != null ? String(row.ev_note) : null,
              occurred_at: String(row.ev_occurred_at),
            }
          : undefined,
      })),
      recent_events: recentEventsResult.rows.map((row) => ({
        id: Number(row.id),
        user_id: Number(row.user_id),
        type: String(row.type),
        source: String(row.source),
        note: row.note != null ? String(row.note) : null,
        occurred_at: String(row.occurred_at),
        expense: row.expense_id
          ? {
              id: Number(row.expense_id),
              event_id: Number(row.id),
              category_id:
                row.category_id != null ? Number(row.category_id) : null,
              amount: String(row.amount),
              merchant: row.merchant != null ? String(row.merchant) : null,
              payment_method: String(row.payment_method),
              category: row.cat_id
                ? {
                    id: Number(row.cat_id),
                    name: String(row.cat_name),
                    icon: String(row.cat_icon),
                    color: String(row.cat_color),
                  }
                : undefined,
            }
          : undefined,
        task: row.task_id
          ? {
              id: Number(row.task_id),
              user_id: Number(row.user_id),
              event_id: Number(row.id),
              title: String(row.task_title),
              status: row.task_status as "pending" | "done",
              due_at: row.task_due_at != null ? String(row.task_due_at) : null,
            }
          : undefined,
      })),
      category_spending: categorySpending,
    },
  };
}
