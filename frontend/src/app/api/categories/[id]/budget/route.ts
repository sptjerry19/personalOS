import { withAuth } from "@/lib/server/auth";
import { json, parseBody } from "@/lib/server/http";
import { setCategoryBudget } from "@/lib/server/services/categories";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (user) => {
    const { id } = await params;
    const categoryId = parseInt(id, 10);
    const body = await parseBody<{ monthly_budget?: number | null }>(request);

    const result = await setCategoryBudget(
      user,
      categoryId,
      body.monthly_budget ?? null
    );

    return json(result);
  });
}
