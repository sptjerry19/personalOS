import { withAuth } from "@/lib/server/auth";
import { error, json, parseBody } from "@/lib/server/http";
import { saveQuickAdd } from "@/lib/server/services/quick-add";

export async function POST(request: Request) {
  return withAuth(request, async (user) => {
    const body = await parseBody<{
      input?: string;
      intent?: string;
      preview?: Record<string, unknown>;
      override?: Record<string, unknown>;
    }>(request);

    if (!body.input?.trim()) {
      return error("input is required", 422);
    }

    const result = await saveQuickAdd(user, body.input, {
      intent: body.intent,
      preview: body.preview,
      override: body.override,
    });

    return json(result, 201);
  });
}
