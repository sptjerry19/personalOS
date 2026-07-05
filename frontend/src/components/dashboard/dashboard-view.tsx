"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AppShell } from "@/components/layout/app-shell";
import {
  BentoCard,
  BentoGrid,
  BudgetBar,
  MetricValue,
} from "@/components/dashboard/bento";
import { QuickAddCommand } from "@/components/quick-add/command-palette";
import { CategorySpendingList } from "@/components/finance/category-spending-list";
import type { DashboardData } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Search, Settings2 } from "lucide-react";
import { SalaryDialog } from "@/components/finance/salary-dialog";
import { useRouter } from "next/navigation";

export function DashboardView({ data }: { data: DashboardData }) {
  const router = useRouter();
  const [commandOpen, setCommandOpen] = useState(false);
  const [salaryOpen, setSalaryOpen] = useState(false);
  const categorySpending = data.widgets.category_spending ?? [];
  const overBudgetCount = data.summary.over_budget_categories ?? 0;
  const salary = data.summary.salary ?? data.summary.budget;
  const noSalary = !salary || salary <= 0;

  return (
    <>
      <AppShell onOpenCommand={() => setCommandOpen(true)}>
        <div className="mb-8 grid gap-6 md:grid-cols-[1.2fr_0.8fr] md:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Today overview
            </p>
            <h1 className="mt-2 text-4xl font-medium tracking-tighter text-foreground md:text-5xl">
              Your life, one command away.
            </h1>
          </div>
          <Button
            variant="outline"
            className="h-12 justify-start border-white/10 bg-white/5 px-4 text-muted-foreground"
            onClick={() => setCommandOpen(true)}
          >
            <Search className="size-4" />
            Quick add: cafe 35, an trua 65...
            <kbd className="ml-auto rounded bg-black/30 px-2 py-1 font-mono text-[10px]">
              Ctrl K
            </kbd>
          </Button>
        </div>

        <BentoGrid>
          <BentoCard
            title="Today spend"
            subtitle="Tracked from quick add and finance"
            className="md:col-span-4"
          >
            <MetricValue
              label="Expense"
              value={formatCurrency(data.summary.today_expense)}
              accent
            />
          </BentoCard>

          <BentoCard
            title="Budget pulse"
            subtitle="Hạn mức theo lương tháng"
            className="md:col-span-5"
          >
            <div className="mb-3 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className="border-white/10"
                onClick={() => setSalaryOpen(true)}
              >
                <Settings2 className="size-4" />
                {noSalary ? "Đặt lương tháng" : "Sửa lương"}
              </Button>
            </div>
            {noSalary ? (
              <p className="text-sm text-muted-foreground">
                Chưa đặt lương tháng. Bấm &quot;Đặt lương tháng&quot; để thiết
                lập hạn mức chi tiêu.
              </p>
            ) : (
              <BudgetBar
                spent={data.summary.month_expense}
                budget={data.summary.budget}
              />
            )}
            {data.summary.over_monthly_budget ? (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertTriangle className="size-4 shrink-0" />
                Đã vượt hạn mức lương tháng
              </div>
            ) : null}
            {overBudgetCount > 0 ? (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertTriangle className="size-4 shrink-0" />
                {overBudgetCount} danh mục vượt ngân sách
              </div>
            ) : null}
          </BentoCard>

          <BentoCard
            title="Open tasks"
            subtitle="Pending across modules"
            className="md:col-span-3"
          >
            <MetricValue
              label="Pending"
              value={String(data.summary.pending_tasks)}
              hint="Tap Tasks to manage"
            />
          </BentoCard>

          <BentoCard
            title="Chi tiêu theo danh mục"
            subtitle="Tổng hợp tháng này"
            className="md:col-span-12"
          >
            <CategorySpendingList categories={categorySpending} />
          </BentoCard>

          <BentoCard
            title="Recent events"
            subtitle="Event-first timeline"
            className="md:col-span-7"
          >
            <div className="space-y-3">
              {data.widgets.recent_events.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No events yet. Press Ctrl+K to add your first note.
                </p>
              ) : (
                data.widgets.recent_events.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between border-t border-white/5 py-3 first:border-t-0 first:pt-0"
                  >
                    <div>
                      <p className="text-sm text-foreground">
                        {event.note ?? event.type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(event.occurred_at)}
                      </p>
                    </div>
                    <Badge variant="secondary" className="capitalize">
                      {event.type}
                    </Badge>
                  </motion.div>
                ))
              )}
            </div>
          </BentoCard>

          <BentoCard
            title="Upcoming tasks"
            subtitle="Auto-sorted by due date"
            className="md:col-span-5"
          >
            <div className="space-y-3">
              {data.widgets.tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Queue is clear. Add a task with quick add.
                </p>
              ) : (
                data.widgets.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between border-t border-white/5 py-3 first:border-t-0 first:pt-0"
                  >
                    <p className="text-sm text-foreground">{task.title}</p>
                    <span className="font-mono text-xs text-muted-foreground">
                      {formatDate(task.due_at)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </BentoCard>
        </BentoGrid>
      </AppShell>

      <QuickAddCommand open={commandOpen} onOpenChange={setCommandOpen} />
      <SalaryDialog
        open={salaryOpen}
        onOpenChange={setSalaryOpen}
        currentSalary={salary}
        onUpdated={() => router.refresh()}
      />
    </>
  );
}
