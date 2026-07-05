import { withAuth } from "@/lib/server/auth";
import { json } from "@/lib/server/http";
import { query, table } from "@/lib/server/db";

export async function GET(request: Request) {
  return withAuth(request, async () => {
    const categoriesTable = table("expense_categories");
    const result = await query(
      `SELECT id, name, icon, color FROM ${categoriesTable} ORDER BY name ASC`
    );
    return json(result.rows);
  });
}
