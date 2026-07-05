import { withAuth } from "@/lib/server/auth";
import { json } from "@/lib/server/http";

export async function GET(request: Request) {
  return withAuth(request, async (user) => json(user));
}
