import { query, table } from "@/lib/server/db";
import type { DbUser } from "@/lib/server/auth";
import { mapExpenseRow } from "@/lib/server/services/quick-add";
import type { Paginated } from "@/types";
import type { Expense, Task } from "@/types";

export async function listExpenses(
  user: DbUser,
  options: {
    page?: number;
    categoryId?: number;
    uncategorized?: boolean;
    date?: string;
  } = {}
): Promise<Paginated<Expense>> {
  const page = options.page ?? 1;
  const perPage = 20;
  const offset = (page - 1) * perPage;
  const expensesTable = table("expenses");
  const eventsTable = table("events");
  const categoriesTable = table("expense_categories");

  const conditions = ["ev.user_id = $1"];
  const params: unknown[] = [user.id];
  let paramIndex = 2;

  if (options.date) {
    conditions.push(`ev.occurred_at::date = $${paramIndex++}::date`);
    params.push(options.date);
  }
  if (options.categoryId != null) {
    conditions.push(`e.category_id = $${paramIndex++}`);
    params.push(options.categoryId);
  }
  if (options.uncategorized) {
    conditions.push("e.category_id IS NULL");
  }

  const where = conditions.join(" AND ");

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM ${expensesTable} e
     JOIN ${eventsTable} ev ON ev.id = e.event_id
     WHERE ${where}`,
    params
  );
  const total = parseInt(countResult.rows[0]?.count ?? "0", 10);

  const rows = await query(
    `SELECT e.*,
            ev.id AS ev_id, ev.user_id AS ev_user_id, ev.type AS ev_type,
            ev.source AS ev_source, ev.note AS ev_note, ev.occurred_at AS ev_occurred_at,
            c.id AS cat_id, c.name AS cat_name, c.icon AS cat_icon, c.color AS cat_color
     FROM ${expensesTable} e
     JOIN ${eventsTable} ev ON ev.id = e.event_id
     LEFT JOIN ${categoriesTable} c ON c.id = e.category_id
     WHERE ${where}
     ORDER BY e.created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, perPage, offset]
  );

  return {
    data: rows.rows.map(mapExpenseRow),
    current_page: page,
    last_page: Math.max(1, Math.ceil(total / perPage)),
    total,
  };
}

export async function createExpense(
  user: DbUser,
  data: {
    amount: number;
    category_id?: number | null;
    payment_method?: string;
    merchant?: string | null;
    note?: string | null;
    occurred_at?: string | null;
  }
) {
  const eventsTable = table("events");
  const expensesTable = table("expenses");

  const eventResult = await query<{ id: number }>(
    `INSERT INTO ${eventsTable} (user_id, type, source, note, occurred_at, created_at, updated_at)
     VALUES ($1, 'expense', 'manual', $2, COALESCE($3::timestamptz, NOW()), NOW(), NOW())
     RETURNING id`,
    [user.id, data.note ?? null, data.occurred_at ?? null]
  );

  const expenseResult = await query(
    `INSERT INTO ${expensesTable}
       (event_id, category_id, amount, payment_method, merchant, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
     RETURNING id`,
    [
      eventResult.rows[0].id,
      data.category_id ?? null,
      data.amount,
      data.payment_method ?? "cash",
      data.merchant ?? null,
    ]
  );

  return loadExpense(user, expenseResult.rows[0].id as number);
}

export async function updateExpense(
  user: DbUser,
  expenseId: number,
  data: {
    amount?: number;
    category_id?: number | null;
    payment_method?: string;
    merchant?: string | null;
    note?: string | null;
    occurred_at?: string | null;
  }
) {
  const existing = await loadExpense(user, expenseId);
  if (!existing) {
    throw Response.json({ message: "Forbidden." }, { status: 403 });
  }

  const expensesTable = table("expenses");
  const eventsTable = table("events");

  const fields: string[] = [];
  const params: unknown[] = [];
  let i = 1;

  if (data.amount !== undefined) {
    fields.push(`amount = $${i++}`);
    params.push(data.amount);
  }
  if (data.category_id !== undefined) {
    fields.push(`category_id = $${i++}`);
    params.push(data.category_id);
  }
  if (data.payment_method !== undefined) {
    fields.push(`payment_method = $${i++}`);
    params.push(data.payment_method);
  }
  if (data.merchant !== undefined) {
    fields.push(`merchant = $${i++}`);
    params.push(data.merchant);
  }

  if (fields.length > 0) {
    params.push(expenseId);
    await query(
      `UPDATE ${expensesTable} SET ${fields.join(", ")}, updated_at = NOW() WHERE id = $${i}`,
      params
    );
  }

  if (data.note !== undefined || data.occurred_at !== undefined) {
    await query(
      `UPDATE ${eventsTable}
       SET note = COALESCE($2, note),
           occurred_at = COALESCE($3::timestamptz, occurred_at),
           updated_at = NOW()
       WHERE id = $1`,
      [existing.event_id, data.note ?? null, data.occurred_at ?? null]
    );
  }

  return loadExpense(user, expenseId);
}

export async function deleteExpense(user: DbUser, expenseId: number) {
  const existing = await loadExpense(user, expenseId);
  if (!existing) {
    throw Response.json({ message: "Forbidden." }, { status: 403 });
  }

  const expensesTable = table("expenses");
  const eventsTable = table("events");

  await query(`DELETE FROM ${expensesTable} WHERE id = $1`, [expenseId]);
  await query(`DELETE FROM ${eventsTable} WHERE id = $1`, [existing.event_id]);
}

async function loadExpense(user: DbUser, expenseId: number) {
  const expensesTable = table("expenses");
  const eventsTable = table("events");
  const categoriesTable = table("expense_categories");

  const result = await query(
    `SELECT e.*,
            ev.id AS ev_id, ev.user_id AS ev_user_id, ev.type AS ev_type,
            ev.source AS ev_source, ev.note AS ev_note, ev.occurred_at AS ev_occurred_at,
            c.id AS cat_id, c.name AS cat_name, c.icon AS cat_icon, c.color AS cat_color
     FROM ${expensesTable} e
     JOIN ${eventsTable} ev ON ev.id = e.event_id
     LEFT JOIN ${categoriesTable} c ON c.id = e.category_id
     WHERE e.id = $1 AND ev.user_id = $2`,
    [expenseId, user.id]
  );

  if (!result.rows[0]) return null;
  return mapExpenseRow(result.rows[0]);
}

export async function listTasks(
  user: DbUser,
  options: { page?: number; status?: string } = {}
): Promise<Paginated<Task>> {
  const page = options.page ?? 1;
  const perPage = 20;
  const offset = (page - 1) * perPage;
  const tasksTable = table("tasks");
  const eventsTable = table("events");

  const conditions = ["t.user_id = $1"];
  const params: unknown[] = [user.id];
  let paramIndex = 2;

  if (options.status) {
    conditions.push(`t.status = $${paramIndex++}`);
    params.push(options.status);
  }

  const where = conditions.join(" AND ");

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM ${tasksTable} t WHERE ${where}`,
    params
  );
  const total = parseInt(countResult.rows[0]?.count ?? "0", 10);

  const rows = await query(
    `SELECT t.*,
            ev.id AS ev_id, ev.type AS ev_type, ev.source AS ev_source,
            ev.note AS ev_note, ev.occurred_at AS ev_occurred_at
     FROM ${tasksTable} t
     LEFT JOIN ${eventsTable} ev ON ev.id = t.event_id
     WHERE ${where}
     ORDER BY t.due_at IS NULL, t.due_at ASC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, perPage, offset]
  );

  return {
    data: rows.rows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      event_id: row.event_id,
      title: row.title,
      status: row.status,
      due_at: row.due_at,
      event: row.ev_id
        ? {
            id: row.ev_id,
            user_id: row.user_id,
            type: row.ev_type,
            source: row.ev_source,
            note: row.ev_note,
            occurred_at: row.ev_occurred_at,
          }
        : undefined,
    })),
    current_page: page,
    last_page: Math.max(1, Math.ceil(total / perPage)),
    total,
  };
}

export async function createTask(
  user: DbUser,
  data: {
    title: string;
    status?: string;
    due_at?: string | null;
  }
) {
  const eventsTable = table("events");
  const tasksTable = table("tasks");

  const eventResult = await query<{ id: number }>(
    `INSERT INTO ${eventsTable} (user_id, type, source, note, occurred_at, created_at, updated_at)
     VALUES ($1, 'task', 'manual', $2, NOW(), NOW(), NOW())
     RETURNING id`,
    [user.id, data.title]
  );

  const taskResult = await query(
    `INSERT INTO ${tasksTable}
       (user_id, event_id, title, status, due_at, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
     RETURNING *`,
    [
      user.id,
      eventResult.rows[0].id,
      data.title,
      data.status ?? "pending",
      data.due_at ?? null,
    ]
  );

  return loadTask(user, taskResult.rows[0].id as number);
}

export async function updateTask(
  user: DbUser,
  taskId: number,
  data: {
    title?: string;
    status?: string;
    due_at?: string | null;
  }
) {
  const existing = await loadTask(user, taskId);
  if (!existing) {
    throw Response.json({ message: "Forbidden." }, { status: 403 });
  }

  const tasksTable = table("tasks");
  const fields: string[] = [];
  const params: unknown[] = [];
  let i = 1;

  if (data.title !== undefined) {
    fields.push(`title = $${i++}`);
    params.push(data.title);
  }
  if (data.status !== undefined) {
    fields.push(`status = $${i++}`);
    params.push(data.status);
  }
  if (data.due_at !== undefined) {
    fields.push(`due_at = $${i++}`);
    params.push(data.due_at);
  }

  if (fields.length > 0) {
    params.push(taskId);
    await query(
      `UPDATE ${tasksTable} SET ${fields.join(", ")}, updated_at = NOW() WHERE id = $${i}`,
      params
    );
  }

  return loadTask(user, taskId);
}

export async function deleteTask(user: DbUser, taskId: number) {
  const existing = await loadTask(user, taskId);
  if (!existing) {
    throw Response.json({ message: "Forbidden." }, { status: 403 });
  }

  const tasksTable = table("tasks");
  const eventsTable = table("events");

  if (existing.event_id) {
    await query(`DELETE FROM ${eventsTable} WHERE id = $1`, [existing.event_id]);
  }
  await query(`DELETE FROM ${tasksTable} WHERE id = $1`, [taskId]);
}

async function loadTask(user: DbUser, taskId: number) {
  const tasksTable = table("tasks");
  const eventsTable = table("events");

  const result = await query(
    `SELECT t.*,
            ev.id AS ev_id, ev.type AS ev_type, ev.source AS ev_source,
            ev.note AS ev_note, ev.occurred_at AS ev_occurred_at
     FROM ${tasksTable} t
     LEFT JOIN ${eventsTable} ev ON ev.id = t.event_id
     WHERE t.id = $1 AND t.user_id = $2`,
    [taskId, user.id]
  );

  if (!result.rows[0]) return null;
  const row = result.rows[0];
  return {
    id: row.id,
    user_id: row.user_id,
    event_id: row.event_id,
    title: row.title,
    status: row.status,
    due_at: row.due_at,
    event: row.ev_id
      ? {
          id: row.ev_id,
          user_id: row.user_id,
          type: row.ev_type,
          source: row.ev_source,
          note: row.ev_note,
          occurred_at: row.ev_occurred_at,
        }
      : undefined,
  };
}
