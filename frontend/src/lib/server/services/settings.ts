import { query, table } from "@/lib/server/db";
import type { DbUser } from "@/lib/server/auth";

export async function updateUserSalary(
  user: DbUser,
  salary: number
): Promise<DbUser> {
  const usersTable = table("users");

  const result = await query<DbUser & { salary: string | null }>(
    `UPDATE ${usersTable}
     SET salary = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING id, supabase_id, name, email, avatar_url, salary`,
    [user.id, salary]
  );

  const row = result.rows[0];
  return {
    id: row.id,
    supabase_id: row.supabase_id,
    name: row.name,
    email: row.email,
    avatar_url: row.avatar_url,
    salary: row.salary != null ? parseFloat(row.salary) : null,
  };
}

export async function getUserSalary(userId: number): Promise<number | null> {
  const usersTable = table("users");
  const result = await query<{ salary: string | null }>(
    `SELECT salary FROM ${usersTable} WHERE id = $1`,
    [userId]
  );
  const salary = result.rows[0]?.salary;
  return salary != null ? parseFloat(salary) : null;
}
