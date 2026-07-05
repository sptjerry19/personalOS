import { withAuth } from "@/lib/server/auth";
import { error, json, parseBody } from "@/lib/server/http";
import {
  createCategory,
  listCategoriesForUser,
} from "@/lib/server/services/categories";

export async function GET(request: Request) {
  return withAuth(request, async (user) => {
    const categories = await listCategoriesForUser(user);
    return json(categories);
  });
}

export async function POST(request: Request) {
  return withAuth(request, async (user) => {
    try {
      const body = await parseBody<{
        name?: string;
        icon?: string;
        color?: string;
      }>(request);

      if (!body.name?.trim()) {
        return error("name is required", 422);
      }

      await createCategory({
        name: body.name.trim(),
        icon: body.icon,
        color: body.color,
      });

      const categories = await listCategoriesForUser(user);
      const created = categories.find((c) => c.name === body.name?.trim());
      return json(created, 201);
    } catch (err) {
      if (err instanceof Response) return err;
      throw err;
    }
  });
}
