import { query, table } from "@/lib/server/db";

export type DbUser = {
  id: number;
  supabase_id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  salary: number | null;
};

function resolveName(supabaseUser: Record<string, unknown>): string {
  const metadata = (supabaseUser.user_metadata ?? {}) as Record<string, unknown>;
  const email = String(supabaseUser.email ?? "");
  return String(
    metadata.full_name ?? metadata.name ?? email.split("@")[0] ?? "User"
  );
}

async function syncUser(supabaseUser: Record<string, unknown>): Promise<DbUser> {
  const email = supabaseUser.email as string | undefined;

  if (!email) {
    throw new Error("Invalid user payload.");
  }

  const usersTable = table("users");
  const supabaseId = String(supabaseUser.id);
  const name = resolveName(supabaseUser);
  const avatarUrl =
    ((supabaseUser.user_metadata as Record<string, unknown> | undefined)
      ?.avatar_url as string | undefined) ?? null;

  const existing = await query<DbUser & { salary: string | null }>(
    `SELECT id, supabase_id, name, email, avatar_url, salary
     FROM ${usersTable}
     WHERE supabase_id = $1
     LIMIT 1`,
    [supabaseId]
  );

  if (existing.rows[0]) {
    const updated = await query<DbUser & { salary: string | null }>(
      `UPDATE ${usersTable}
       SET email = $2, name = $3, avatar_url = COALESCE($4, avatar_url), updated_at = NOW()
       WHERE supabase_id = $1
       RETURNING id, supabase_id, name, email, avatar_url, salary`,
      [supabaseId, email, name, avatarUrl]
    );
    return mapDbUser(updated.rows[0]);
  }

  const created = await query<DbUser & { salary: string | null }>(
    `INSERT INTO ${usersTable} (supabase_id, name, email, avatar_url, password, created_at, updated_at)
     VALUES ($1, $2, $3, $4, NULL, NOW(), NOW())
     RETURNING id, supabase_id, name, email, avatar_url, salary`,
    [supabaseId, name, email, avatarUrl]
  );

  return mapDbUser(created.rows[0]);
}

function mapDbUser(row: {
  id: number;
  supabase_id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  salary: string | null;
}): DbUser {
  return {
    id: row.id,
    supabase_id: row.supabase_id,
    name: row.name,
    email: row.email,
    avatar_url: row.avatar_url,
    salary: row.salary != null ? parseFloat(row.salary) : null,
  };
}

export async function authenticateToken(token: string): Promise<DbUser> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured.");
  }

  const response = await fetch(
    `${supabaseUrl.replace(/\/$/, "")}/auth/v1/user`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Invalid token.");
  }

  const supabaseUser = (await response.json()) as Record<string, unknown>;
  return syncUser(supabaseUser);
}

export async function requireUser(request: Request): Promise<DbUser> {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    throw Response.json({ message: "Unauthenticated." }, { status: 401 });
  }

  try {
    return await authenticateToken(token);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized.";
    const status = message.includes("not configured") ? 500 : 401;
    throw Response.json({ message }, { status });
  }
}

export async function withAuth(
  request: Request,
  handler: (user: DbUser) => Promise<Response>
): Promise<Response> {
  try {
    const user = await requireUser(request);
    return await handler(user);
  } catch (error) {
    if (error instanceof Response) return error;
    console.error(error);
    return Response.json({ message: "Server error." }, { status: 500 });
  }
}
