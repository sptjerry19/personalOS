import { withAuth } from "@/lib/server/auth";
import { error, json, parseBody } from "@/lib/server/http";
import {
  createExpense,
  listExpenses,
} from "@/lib/server/services/expenses";

export async function GET(request: Request) {
  return withAuth(request, async (user) => {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const categoryId = searchParams.get("category_id");
    const uncategorized = searchParams.get("uncategorized") === "1";

    const data = await listExpenses(user, {
      page,
      categoryId: categoryId ? parseInt(categoryId, 10) : undefined,
      uncategorized,
      date: searchParams.get("date") ?? undefined,
    });

    return json(data);
  });
}

export async function POST(request: Request) {
  return withAuth(request, async (user) => {
    const body = await parseBody<{
      amount?: number;
      category_id?: number | null;
      payment_method?: string;
      merchant?: string | null;
      note?: string | null;
      occurred_at?: string | null;
    }>(request);

    if (body.amount == null || body.amount < 0) {
      return error("amount is required", 422);
    }

    const expense = await createExpense(user, {
      amount: body.amount,
      category_id: body.category_id,
      payment_method: body.payment_method,
      merchant: body.merchant,
      note: body.note,
      occurred_at: body.occurred_at,
    });

    return json(expense, 201);
  });
}
