import { query, table } from "@/lib/server/db";

export type DbUser = {
  id: number;
  supabase_id: string;
  name: string;
  email: string;
  avatar_url: string | null;
};

function resolveName(supabaseUser: Record<string, unknown>): string {
  const metadata = (supabaseUser.user_metadata ?? {}) as Record<string, unknown>;
  const email = String(supabaseUser.email ?? "");
  return String(
    metadata.full_name ?? metadata.name ?? email.split("@")[0] ?? "User"
  );
}

export async function requireUser(request: Request): Promise<DbUser> {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    throw Response.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw Response.json(
      { message: "Supabase is not configured." },
      { status: 500 }
    );
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
    throw Response.json({ message: "Invalid token." }, { status: 401 });
  }

  const supabaseUser = (await response.json()) as Record<string, unknown>;
  const email = supabaseUser.email as string | undefined;

  if (!email) {
    throw Response.json({ message: "Invalid user payload." }, { status: 401 });
  }

  const usersTable = table("users");
  const supabaseId = String(supabaseUser.id);
  const name = resolveName(supabaseUser);
  const avatarUrl =
    ((supabaseUser.user_metadata as Record<string, unknown> | undefined)
      ?.avatar_url as string | undefined) ?? null;

  const existing = await query<DbUser>(
    `SELECT id, supabase_id, name, email, avatar_url
     FROM ${usersTable}
     WHERE supabase_id = $1
     LIMIT 1`,
    [supabaseId]
  );

  if (existing.rows[0]) {
    const updated = await query<DbUser>(
      `UPDATE ${usersTable}
       SET email = $2, name = $3, avatar_url = COALESCE($4, avatar_url), updated_at = NOW()
       WHERE supabase_id = $1
       RETURNING id, supabase_id, name, email, avatar_url`,
      [supabaseId, email, name, avatarUrl]
    );
    return updated.rows[0];
  }

  const created = await query<DbUser>(
    `INSERT INTO ${usersTable} (supabase_id, name, email, avatar_url, password, created_at, updated_at)
     VALUES ($1, $2, $3, $4, NULL, NOW(), NOW())
     RETURNING id, supabase_id, name, email, avatar_url`,
    [supabaseId, name, email, avatarUrl]
  );

  return created.rows[0];
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
