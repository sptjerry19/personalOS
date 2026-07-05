import { withAuth } from "@/lib/server/auth";
import { json, parseBody } from "@/lib/server/http";
import { deleteTask, updateTask } from "@/lib/server/services/expenses";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (user) => {
    const { id } = await params;
    const taskId = parseInt(id, 10);
    const body = await parseBody<{
      title?: string;
      status?: string;
      due_at?: string | null;
    }>(request);

    try {
      const task = await updateTask(user, taskId, body);
      return json(task);
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
    const taskId = parseInt(id, 10);

    try {
      await deleteTask(user, taskId);
      return json({ message: "Deleted." });
    } catch (err) {
      if (err instanceof Response) return err;
      throw err;
    }
  });
}
