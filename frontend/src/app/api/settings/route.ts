import { withAuth } from "@/lib/server/auth";
import { error, json, parseBody } from "@/lib/server/http";
import { updateUserSalary } from "@/lib/server/services/settings";

export async function GET(request: Request) {
  return withAuth(request, async (user) =>
    json({
      salary: user.salary,
    })
  );
}

export async function PUT(request: Request) {
  return withAuth(request, async (user) => {
    const body = await parseBody<{ salary?: number }>(request);

    if (body.salary == null || body.salary < 0 || Number.isNaN(body.salary)) {
      return error("salary must be a non-negative number", 422);
    }

    const updated = await updateUserSalary(user, body.salary);
    return json({ salary: updated.salary });
  });
}
