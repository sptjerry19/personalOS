"use client";

import { useState } from "react";
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
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const COLOR_PRESETS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#8b5cf6",
  "#71717a",
];

export function CategoryDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLOR_PRESETS[0]);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      await api.createCategory({ name: name.trim(), color });
      toast.success("Đã thêm danh mục");
      setName("");
      setColor(COLOR_PRESETS[0]);
      onOpenChange(false);
      onCreated?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Thêm danh mục thất bại");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-zinc-950">
        <DialogHeader>
          <DialogTitle>Thêm danh mục</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label>Tên danh mục</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Coffee, Gym..."
              required
            />
          </div>
          <div className="grid gap-2">
            <Label>Màu</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setColor(preset)}
                  className={cn(
                    "size-8 rounded-full border-2 transition-transform active:scale-95",
                    color === preset ? "border-white scale-110" : "border-transparent"
                  )}
                  style={{ backgroundColor: preset }}
                />
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : "Lưu danh mục"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
