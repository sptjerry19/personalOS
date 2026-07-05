import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { authenticateToken } from "@/lib/server/auth";
import { getDashboardForUser } from "@/lib/server/services/dashboard";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export const dynamic = "force-dynamic";

function ConfigError({ message }: { message: string }) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4">
      <div className="glass-panel max-w-md rounded-[2rem] p-8 text-center">
        <h1 className="text-xl font-medium">Không tải được dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnon) {
    return (
      <ConfigError message="Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc NEXT_PUBLIC_SUPABASE_ANON_KEY trên Vercel." />
    );
  }

  if (!process.env.DATABASE_URL) {
    return (
      <ConfigError message="Thiếu DATABASE_URL trên Vercel (Settings → Environment Variables)." />
    );
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return (
      <ConfigError message="Thiếu SUPABASE_SERVICE_ROLE_KEY (JWT service_role từ Supabase Dashboard)." />
    );
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) redirect("/login");

    const dbUser = await authenticateToken(session.access_token);
    const dashboard = await getDashboardForUser(dbUser);

    return (
      <div className="noise-overlay">
        <DashboardView data={dashboard} />
      </div>
    );
  } catch (error) {
    if (isRedirectError(error)) throw error;

    console.error("[dashboard]", error);
    const message =
      error instanceof Error
        ? error.message
        : "Lỗi server khi tải dashboard.";
    return <ConfigError message={message} />;
  }
}
