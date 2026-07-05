"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import type { ExpenseCategory } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function BudgetManagerDialog({
  open,
  onOpenChange,
  categories,
  onUpdated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: ExpenseCategory[];
  onUpdated?: () => void;
}) {
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    const next: Record<number, string> = {};
    for (const category of categories) {
      next[category.id] =
        category.monthly_budget != null ? String(category.monthly_budget) : "";
    }
    setDrafts(next);
  }, [open, categories]);

  async function handleSave(categoryId: number) {
    const raw = drafts[categoryId]?.trim();
    const monthlyBudget = raw ? Number(raw) : null;

    if (raw && (Number.isNaN(monthlyBudget) || monthlyBudget! < 0)) {
      toast.error("Ngân sách không hợp lệ");
      return;
    }

    setSavingId(categoryId);
    try {
      await api.updateCategoryBudget(categoryId, monthlyBudget);
      toast.success("Đã cập nhật ngân sách");
      onUpdated?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Cập nhật thất bại");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto border-white/10 bg-zinc-950 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Quản lý ngân sách tháng</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Đặt hạn mức chi tiêu theo danh mục. Ví dụ Food: 3.000.000 ₫.
        </p>
        <div className="space-y-4">
          {categories.map((category) => {
            const spent = category.month_spent ?? 0;
            const budget = category.monthly_budget ?? null;
            const over = category.is_over_budget;

            return (
              <div
                key={category.id}
                className="rounded-xl border border-white/10 bg-white/5 p-4"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <span
                    className={
                      over
                        ? "text-xs font-medium text-destructive"
                        : "text-xs text-muted-foreground"
                    }
                  >
                    Đã chi: {formatCurrency(spent)}
                    {budget != null ? ` / ${formatCurrency(budget)}` : ""}
                  </span>
                </div>
                <div className="flex gap-2">
                  <div className="grid flex-1 gap-1">
                    <Label className="text-xs">Ngân sách (VND)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={drafts[category.id] ?? ""}
                      onChange={(e) =>
                        setDrafts((d) => ({
                          ...d,
                          [category.id]: e.target.value,
                        }))
                      }
                      placeholder="3000000"
                    />
                  </div>
                  <Button
                    type="button"
                    className="mt-5"
                    disabled={savingId === category.id}
                    onClick={() => void handleSave(category.id)}
                  >
                    {savingId === category.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      "Lưu"
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
