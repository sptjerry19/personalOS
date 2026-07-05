"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  CheckSquare,
  LogOut,
  Command,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/finance", label: "Finance", icon: Wallet },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
];

export function AppShell({
  children,
  onOpenCommand,
}: {
  children: React.ReactNode;
  onOpenCommand?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-[1400px] flex-col px-4 py-6 md:px-8">
      <header className="mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="group flex items-center gap-3">
            <div className="glass-panel flex size-10 items-center justify-center rounded-2xl">
              <span className="font-mono text-sm font-semibold text-primary">
                OS
              </span>
            </div>
            <div>
              <p className="text-sm font-medium tracking-tight text-foreground">
                Personal OS
              </p>
              <p className="text-xs text-muted-foreground">
                Life operating system
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-all active:scale-[0.98]",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  )}
                >
                  <Icon className="size-4" strokeWidth={1.75} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenCommand}
            className="hidden border-white/10 bg-white/5 sm:inline-flex"
          >
            <Command className="size-4" />
            Quick Add
            <kbd className="ml-2 rounded bg-black/30 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              Ctrl K
            </kbd>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            aria-label="Sign out"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
