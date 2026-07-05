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
import { formatCurrency } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function SalaryDialog({
  open,
  onOpenChange,
  currentSalary,
  onUpdated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSalary?: number | null;
  onUpdated?: () => void;
}) {
  const [salary, setSalary] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSalary(currentSalary != null ? String(currentSalary) : "");
  }, [open, currentSalary]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(salary);
    if (Number.isNaN(value) || value < 0) {
      toast.error("Lương tháng không hợp lệ");
      return;
    }

    setSaving(true);
    try {
      await api.updateSalary(value);
      toast.success("Đã cập nhật lương tháng");
      onOpenChange(false);
      onUpdated?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Cập nhật thất bại");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-zinc-950 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Lương tháng</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Dùng làm hạn mức chi tiêu tổng trên dashboard.
          {currentSalary != null ? (
            <>
              {" "}
              Hiện tại:{" "}
              <span className="font-mono text-foreground">
                {formatCurrency(currentSalary)}
              </span>
            </>
          ) : null}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label>Lương tháng (VND)</Label>
            <Input
              type="number"
              min={0}
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              placeholder="15000000"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : "Lưu"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
