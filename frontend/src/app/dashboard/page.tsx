import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { apiPath } from "@/lib/api-base";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import type { DashboardData } from "@/types";

async function getDashboard(token: string): Promise<DashboardData | null> {
  const response = await fetch(apiPath("/dashboard"), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) return null;
  return response.json();
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  const dashboard = await getDashboard(session.access_token);

  if (!dashboard) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center px-4">
        <div className="glass-panel max-w-md rounded-[2rem] p-8 text-center">
          <h1 className="text-xl font-medium">API unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Kiểm tra DATABASE_URL và SUPABASE_SERVICE_ROLE_KEY trong
            .env.local, rồi refresh.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="noise-overlay">
      <DashboardView data={dashboard} />
    </div>
  );
}
