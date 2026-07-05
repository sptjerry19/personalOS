"use client";

import { cn } from "@/lib/utils";
import type { ExpenseCategory } from "@/types";

export function CategoryPicker({
  categories,
  value,
  onChange,
  className,
  allowAll = false,
  allLabel = "Tất cả",
}: {
  categories: ExpenseCategory[];
  value: number | null;
  onChange: (categoryId: number | null) => void;
  className?: string;
  allowAll?: boolean;
  allLabel?: string;
}) {
  if (categories.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Chưa có danh mục. Chạy{" "}
        <code className="rounded bg-white/5 px-1">php artisan db:seed</code> trên
        backend.
      </p>
    );
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {allowAll ? (
        <button
          type="button"
          onClick={() => onChange(null)}
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-all active:scale-[0.98]",
            value === null
              ? "border-primary/40 bg-primary/15 text-primary"
              : "border-white/10 bg-white/5 text-muted-foreground hover:text-foreground"
          )}
        >
          {allLabel}
        </button>
      ) : null}
      {categories.map((category) => {
        const selected = value === category.id;
        return (
          <button
            key={category.id}
            type="button"
            onClick={() => onChange(category.id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-all active:scale-[0.98]",
              selected
                ? "border-primary/40 bg-primary/15 text-primary"
                : "border-white/10 bg-white/5 text-muted-foreground hover:text-foreground"
            )}
          >
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: category.color }}
            />
            {category.name}
          </button>
        );
      })}
    </div>
  );
}
