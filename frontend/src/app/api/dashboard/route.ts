import { withAuth } from "@/lib/server/auth";
import { json } from "@/lib/server/http";
import { getDashboardForUser } from "@/lib/server/services/dashboard";

export async function GET(request: Request) {
  return withAuth(request, async (user) => {
    const data = await getDashboardForUser(user);
    return json(data);
  });
}
