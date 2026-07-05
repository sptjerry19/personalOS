import { withAuth } from "@/lib/server/auth";
import { error, json, parseBody } from "@/lib/server/http";
import { previewQuickAdd } from "@/lib/server/services/quick-add";

export async function POST(request: Request) {
  return withAuth(request, async () => {
    const body = await parseBody<{ input?: string }>(request);
    if (!body.input?.trim()) {
      return error("input is required", 422);
    }
    const result = await previewQuickAdd(body.input);
    return json(result);
  });
}
