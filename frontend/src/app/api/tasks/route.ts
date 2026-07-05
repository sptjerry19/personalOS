import { withAuth } from "@/lib/server/auth";
import { error, json, parseBody } from "@/lib/server/http";
import { createTask, listTasks } from "@/lib/server/services/expenses";

export async function GET(request: Request) {
  return withAuth(request, async (user) => {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const status = searchParams.get("status") ?? undefined;

    const data = await listTasks(user, { page, status });
    return json(data);
  });
}

export async function POST(request: Request) {
  return withAuth(request, async (user) => {
    const body = await parseBody<{
      title?: string;
      status?: string;
      due_at?: string | null;
    }>(request);

    if (!body.title?.trim()) {
      return error("title is required", 422);
    }

    const task = await createTask(user, {
      title: body.title.trim(),
      status: body.status,
      due_at: body.due_at,
    });

    return json(task, 201);
  });
}
