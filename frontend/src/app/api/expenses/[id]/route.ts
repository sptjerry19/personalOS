import { withAuth } from "@/lib/server/auth";
import { json, parseBody } from "@/lib/server/http";
import {
  deleteExpense,
  updateExpense,
} from "@/lib/server/services/expenses";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (user) => {
    const { id } = await params;
    const expenseId = parseInt(id, 10);
    const body = await parseBody<{
      amount?: number;
      category_id?: number | null;
      payment_method?: string;
      merchant?: string | null;
      note?: string | null;
      occurred_at?: string | null;
    }>(request);

    try {
      const expense = await updateExpense(user, expenseId, body);
      return json(expense);
    } catch (err) {
      if (err instanceof Response) return err;
      throw err;
    }
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (user) => {
    const { id } = await params;
    const expenseId = parseInt(id, 10);

    try {
      await deleteExpense(user, expenseId);
      return json({ message: "Deleted." });
    } catch (err) {
      if (err instanceof Response) return err;
      throw err;
    }
  });
}
