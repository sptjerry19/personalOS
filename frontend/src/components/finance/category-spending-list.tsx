"use client";

import type { ExpenseCategory } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

export function CategorySpendingList({
  categories,
  compact = false,
}: {
  categories: ExpenseCategory[];
  compact?: boolean;
}) {
  if (categories.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Chưa có chi tiêu theo danh mục trong tháng này.
      </p>
    );
  }

  const maxSpent = Math.max(
    ...categories.map((c) => c.month_spent ?? 0),
    1
  );

  return (
    <div className="space-y-3">
      {categories.map((category) => {
        const spent = category.month_spent ?? 0;
        const budget = category.monthly_budget ?? null;
        const pct =
          budget && budget > 0
            ? Math.min(100, Math.round((spent / budget) * 100))
            : Math.round((spent / maxSpent) * 100);
        const over = category.is_over_budget;

        return (
          <div key={category.id} className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <span className="truncate text-sm">{category.name}</span>
                {over ? (
                  <AlertTriangle className="size-3.5 shrink-0 text-destructive" />
                ) : null}
              </div>
              <div className="text-right shrink-0">
                <p
                  className={cn(
                    "font-mono text-sm",
                    over ? "text-destructive" : "text-foreground"
                  )}
                >
                  {formatCurrency(spent)}
                </p>
                {!compact && budget != null ? (
                  <p className="text-xs text-muted-foreground">
                    / {formatCurrency(budget)}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  over ? "bg-destructive" : "bg-primary"
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
