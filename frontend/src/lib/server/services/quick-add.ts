import { type PoolClient } from "pg";
import { query, table, withTransaction } from "@/lib/server/db";
import type { DbUser } from "@/lib/server/auth";
import { enrichPreview, parseQuickAddInput } from "@/lib/server/quick-add-parser";
import type { QuickAddPreview } from "@/types";

export async function previewQuickAdd(input: string): Promise<QuickAddPreview> {
  const parsed = await parseQuickAddInput(input);
  return enrichPreview(parsed);
}

export async function saveQuickAdd(
  user: DbUser,
  input: string,
  options?: {
    intent?: string;
    preview?: Record<string, unknown>;
    override?: Record<string, unknown>;
  }
) {
  const parsed = await parseQuickAddInput(input);
  const intent =
    options?.intent ??
    (options?.override?.intent as string | undefined) ??
    parsed.intent;

  const preview: Record<string, unknown> = {
    ...(parsed.preview ?? {}),
    ...(options?.preview ?? {}),
    ...(options?.override ?? {}),
  };
  delete preview.category;

  return withTransaction(async (client) => {
    const eventsTable = table("events");

    const eventResult = await client.query<{ id: number }>(
      `INSERT INTO ${eventsTable} (user_id, type, source, note, occurred_at, created_at, updated_at)
       VALUES ($1, $2, 'quick_add', $3, NOW(), NOW(), NOW())
       RETURNING id`,
      [user.id, intent, input]
    );
    const eventId = eventResult.rows[0].id;

    if (intent === "expense") {
      const expensesTable = table("expenses");
      const expenseResult = await client.query(
        `INSERT INTO ${expensesTable}
           (event_id, category_id, amount, payment_method, merchant, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         RETURNING *`,
        [
          eventId,
          preview.category_id ?? null,
          preview.amount ?? 0,
          preview.payment_method ?? "cash",
          preview.merchant ?? null,
        ]
      );

      const expense = expenseResult.rows[0];
      const withCategory = await loadExpenseById(client, expense.id as number);

      return {
        intent: "expense",
        event_id: eventId,
        expense: withCategory,
      };
    }

    const tasksTable = table("tasks");
    const taskResult = await client.query(
      `INSERT INTO ${tasksTable}
         (user_id, event_id, title, status, due_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING *`,
      [
        user.id,
        eventId,
        preview.title ?? input,
        preview.status ?? "pending",
        preview.due_at ?? null,
      ]
    );

    return {
      intent: "task",
      event_id: eventId,
      task: taskResult.rows[0],
    };
  });
}

async function loadExpenseById(client: PoolClient, expenseId: number) {
  const expensesTable = table("expenses");
  const eventsTable = table("events");
  const categoriesTable = table("expense_categories");

  const result = await client.query(
    `SELECT e.*,
            ev.id AS ev_id, ev.user_id AS ev_user_id, ev.type AS ev_type,
            ev.source AS ev_source, ev.note AS ev_note, ev.occurred_at AS ev_occurred_at,
            c.id AS cat_id, c.name AS cat_name, c.icon AS cat_icon, c.color AS cat_color
     FROM ${expensesTable} e
     JOIN ${eventsTable} ev ON ev.id = e.event_id
     LEFT JOIN ${categoriesTable} c ON c.id = e.category_id
     WHERE e.id = $1`,
    [expenseId]
  );

  const row = result.rows[0];
  if (!row) return null;

  return mapExpenseRow(row);
}

import type { Expense } from "@/types";

function mapExpenseRow(row: Record<string, unknown>): Expense {
  return {
    id: Number(row.id),
    event_id: Number(row.event_id),
    category_id: row.category_id != null ? Number(row.category_id) : null,
    amount: String(row.amount),
    payment_method: String(row.payment_method),
    merchant: row.merchant != null ? String(row.merchant) : null,
    category: row.cat_id
      ? {
          id: Number(row.cat_id),
          name: String(row.cat_name),
          icon: String(row.cat_icon),
          color: String(row.cat_color),
        }
      : undefined,
    event: {
      id: Number(row.ev_id),
      user_id: Number(row.ev_user_id),
      type: String(row.ev_type),
      source: String(row.ev_source),
      note: row.ev_note != null ? String(row.ev_note) : null,
      occurred_at: String(row.ev_occurred_at),
    },
  };
}

export { mapExpenseRow };
