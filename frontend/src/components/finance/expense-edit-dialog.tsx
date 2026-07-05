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
import { CategoryPicker } from "@/components/finance/category-picker";
import { api } from "@/lib/api";
import type { Expense, ExpenseCategory } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function ExpenseEditDialog({
  expense,
  categories,
  open,
  onOpenChange,
  onSaved,
}: {
  expense: Expense | null;
  categories: ExpenseCategory[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}) {
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!expense || !open) return;
    setMerchant(expense.merchant ?? "");
    setAmount(String(Number(expense.amount) / 1000));
    setCategoryId(expense.category_id);
  }, [expense, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!expense) return;

    setSaving(true);
    try {
      await api.updateExpense(expense.id, {
        merchant,
        amount: Number(amount) * 1000,
        category_id: categoryId,
      });
      toast.success("Đã cập nhật chi phí");
      onOpenChange(false);
      onSaved?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Cập nhật thất bại");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-zinc-950">
        <DialogHeader>
          <DialogTitle>Sửa chi phí</DialogTitle>
        </DialogHeader>
        {expense ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {formatDate(expense.event?.occurred_at)} · hiện tại{" "}
              {formatCurrency(Number(expense.amount))}
            </p>
            <div className="grid gap-2">
              <Label>Amount (thousands)</Label>
              <Input
                type="number"
                min={0}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>Merchant</Label>
              <Input
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                placeholder="Com trua"
              />
            </div>
            <div className="grid gap-2">
              <Label>Danh mục</Label>
              <CategoryPicker
                categories={categories}
                value={categoryId}
                onChange={setCategoryId}
              />
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : "Lưu thay đổi"}
            </Button>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
