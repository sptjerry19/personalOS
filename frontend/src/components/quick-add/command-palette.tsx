"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { CategoryPicker } from "@/components/finance/category-picker";
import type { ExpenseCategory, QuickAddPreview } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

const examples = [
  "cafe 35",
  "an trua 65",
  "an toi 7",
  "mua thit bo 250",
  "task: goi dien nuoc",
];

export function QuickAddCommand({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [preview, setPreview] = useState<QuickAddPreview | null>(null);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    api.getCategories().then(setCategories).catch(() => setCategories([]));
  }, [open]);

  useEffect(() => {
    if (!open) {
      setInput("");
      setPreview(null);
      setCategoryId(null);
      setPreviewError(null);
    }
  }, [open]);

  const runPreview = useCallback(async (value: string) => {
    if (!value.trim()) {
      setPreview(null);
      setCategoryId(null);
      setPreviewError(null);
      return;
    }
    setLoading(true);
    setPreview(null);
    setPreviewError(null);
    try {
      const result = await api.previewQuickAdd(value);
      setPreview(result);
      if (result.intent === "expense" && result.preview?.category_id) {
        setCategoryId(Number(result.preview.category_id));
      } else {
        setCategoryId(null);
      }
    } catch (error) {
      setPreview(null);
      setCategoryId(null);
      setPreviewError(
        error instanceof Error ? error.message : "Không thể phân tích nội dung"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => runPreview(input), 300);
    return () => clearTimeout(timer);
  }, [input, runPreview]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onOpenChange]);

  async function handleSave() {
    if (!input.trim() || !preview?.preview) {
      toast.error("Chưa có preview hợp lệ.");
      return;
    }

    setSaving(true);
    try {
      const resolvedCategoryId =
        categoryId ?? Number(preview.preview.category_id) ?? null;

      const previewPayload =
        preview.intent === "expense"
          ? {
              amount: preview.preview.amount,
              merchant: preview.preview.merchant,
              category_id: resolvedCategoryId,
              payment_method: preview.preview.payment_method ?? "cash",
            }
          : {
              title: preview.preview.title,
              status: preview.preview.status ?? "pending",
            };

      await api.saveQuickAdd(input, {
        intent: preview.intent,
        preview: previewPayload,
      });

      toast.success("Đã lưu vào Personal OS");
      setInput("");
      setPreview(null);
      setCategoryId(null);
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="top-1/3 max-w-lg translate-y-0 overflow-hidden rounded-xl! p-0 sm:max-w-lg"
        showCloseButton
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Quick Add</DialogTitle>
          <DialogDescription>Nhập nhanh chi tiêu hoặc task</DialogDescription>
        </DialogHeader>

        <Command
          shouldFilter={false}
          className="rounded-none border-0 bg-transparent p-1 shadow-none"
        >
          <CommandInput
            value={input}
            onValueChange={setInput}
            placeholder="cafe 35, an trua 65, task: mua sua..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && preview?.preview) {
                e.preventDefault();
                void handleSave();
              }
            }}
          />
          {!preview?.preview && !loading ? (
            <CommandList>
              <CommandGroup heading="Ví dụ">
                {examples.map((example) => (
                  <CommandItem
                    key={example}
                    value={example}
                    onSelect={(value) => setInput(value)}
                  >
                    {example}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          ) : null}
        </Command>

        <div className="border-t border-white/10">
          {loading ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Đang phân tích...
            </div>
          ) : previewError ? (
            <div className="px-4 py-3 text-sm text-destructive">{previewError}</div>
          ) : preview?.preview ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4"
            >
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <span className="text-sm font-medium">Preview</span>
                <Badge variant="secondary" className="capitalize">
                  {preview.intent}
                </Badge>
              </div>

              {preview.intent === "expense" ? (
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    Số tiền:{" "}
                    <span className="font-mono text-foreground">
                      {formatCurrency(Number(preview.preview.amount))}
                    </span>
                  </p>
                  <p>
                    Mô tả:{" "}
                    <span className="text-foreground">
                      {String(preview.preview.merchant)}
                    </span>
                  </p>
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-wide">Danh mục</p>
                    <CategoryPicker
                      categories={categories}
                      value={categoryId}
                      onChange={setCategoryId}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-foreground">
                  {String(preview.preview.title)}
                </p>
              )}

              <Button
                type="button"
                className="mt-4 w-full"
                disabled={saving || loading}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  void handleSave();
                }}
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Lưu"
                )}
              </Button>
            </motion.div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
