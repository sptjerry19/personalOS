import { query, table } from "@/lib/server/db";
import type { DbUser } from "@/lib/server/auth";
import type { ExpenseCategory } from "@/types";

function monthStartIso(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

export async function listCategoriesForUser(user: DbUser): Promise<ExpenseCategory[]> {
  const categoriesTable = table("expense_categories");
  const budgetsTable = table("user_category_budgets");
  const expensesTable = table("expenses");
  const eventsTable = table("events");
  const monthStart = monthStartIso();

  const result = await query<{
    id: number;
    name: string;
    icon: string;
    color: string;
    monthly_budget: string | null;
    month_spent: string | null;
  }>(
    `SELECT c.id, c.name, c.icon, c.color,
            b.monthly_budget,
            COALESCE(SUM(e.amount), 0) AS month_spent
     FROM ${categoriesTable} c
     LEFT JOIN ${budgetsTable} b
       ON b.category_id = c.id AND b.user_id = $1
     LEFT JOIN ${expensesTable} e ON e.category_id = c.id
     LEFT JOIN ${eventsTable} ev
       ON ev.id = e.event_id
      AND ev.user_id = $1
      AND ev.occurred_at >= $2
     GROUP BY c.id, c.name, c.icon, c.color, b.monthly_budget
     ORDER BY c.name ASC`,
    [user.id, monthStart]
  );

  return result.rows.map((row) => {
    const monthSpent = parseFloat(row.month_spent ?? "0");
    const monthlyBudget =
      row.monthly_budget != null ? parseFloat(row.monthly_budget) : null;

    return {
      id: row.id,
      name: row.name,
      icon: row.icon,
      color: row.color,
      monthly_budget: monthlyBudget,
      month_spent: monthSpent,
      is_over_budget:
        monthlyBudget !== null && monthSpent > monthlyBudget,
    };
  });
}

export async function monthSpendingByCategory(
  user: DbUser
): Promise<ExpenseCategory[]> {
  const categories = await listCategoriesForUser(user);
  return categories.filter(
    (c) => (c.month_spent ?? 0) > 0 || c.monthly_budget != null
  );
}

export async function createCategory(data: {
  name: string;
  icon?: string;
  color?: string;
}): Promise<void> {
  const categoriesTable = table("expense_categories");
  const existing = await query(
    `SELECT id FROM ${categoriesTable} WHERE name = $1 LIMIT 1`,
    [data.name]
  );
  if (existing.rows.length > 0) {
    throw Response.json({ message: "Category name already exists." }, { status: 422 });
  }

  await query(
    `INSERT INTO ${categoriesTable} (name, icon, color, created_at, updated_at)
     VALUES ($1, $2, $3, NOW(), NOW())`,
    [data.name, data.icon ?? "receipt", data.color ?? "#71717a"]
  );
}

export async function setCategoryBudget(
  user: DbUser,
  categoryId: number,
  monthlyBudget: number | null
): Promise<ExpenseCategory | undefined> {
  const budgetsTable = table("user_category_budgets");

  if (monthlyBudget === null || monthlyBudget <= 0) {
    await query(
      `DELETE FROM ${budgetsTable} WHERE user_id = $1 AND category_id = $2`,
      [user.id, categoryId]
    );
  } else {
    await query(
      `INSERT INTO ${budgetsTable} (user_id, category_id, monthly_budget, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       ON CONFLICT (user_id, category_id)
       DO UPDATE SET monthly_budget = EXCLUDED.monthly_budget, updated_at = NOW()`,
      [user.id, categoryId, monthlyBudget]
    );
  }

  const categories = await listCategoriesForUser(user);
  return categories.find((c) => c.id === categoryId);
}
