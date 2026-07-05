import { Pool, type PoolClient, type QueryResultRow } from "pg";

let pool: Pool | null = null;

export function table(name: string): string {
  const prefix = process.env.DB_TABLE_PREFIX ?? "personal_";
  return `${prefix}${name}`;
}

export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not configured.");
    }

    pool = new Pool({
      connectionString,
      ssl: connectionString.includes("supabase")
        ? { rejectUnauthorized: false }
        : undefined,
    });
  }

  return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
) {
  return getPool().query<T>(text, params);
}

export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
