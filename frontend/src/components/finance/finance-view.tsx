"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AppShell } from "@/components/layout/app-shell";
import { BentoCard } from "@/components/dashboard/bento";
import { QuickAddCommand } from "@/components/quick-add/command-palette";
import { CategoryDialog } from "@/components/finance/category-dialog";
import { BudgetManagerDialog } from "@/components/finance/budget-manager-dialog";
import { ExpenseEditDialog } from "@/components/finance/expense-edit-dialog";
import { CategorySpendingList } from "@/components/finance/category-spending-list";
import { api } from "@/lib/api";
import type { Expense, ExpenseCategory } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
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
import {
  AlertTriangle,
  Loader2,
  Pencil,
  Plus,
  Settings2,
  Tag,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

export function FinanceView() {
  const [commandOpen, setCommandOpen] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [budgetDialogOpen, setBudgetDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [filterCategoryId, setFilterCategoryId] = useState<number | null>(null);
  const [filterUncategorized, setFilterUncategorized] = useState(false);
  const [form, setForm] = useState({
    amount: "",
    merchant: "",
    category_id: null as number | null,
    payment_method: "cash",
  });

  async function loadCategories() {
    const categoryRes = await api.getCategories();
    setCategories(categoryRes);
  }

  async function loadExpenses() {
    setLoading(true);
    try {
      const expenseRes = await api.getExpenses(1, {
        categoryId: filterUncategorized ? undefined : filterCategoryId ?? undefined,
        uncategorized: filterUncategorized,
      });
      setExpenses(expenseRes.data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }

  async function loadData() {
    await Promise.all([loadCategories(), loadExpenses()]);
  }

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadExpenses();
  }, [filterCategoryId, filterUncategorized]);

  useEffect(() => {
    if (categories.length > 0 && form.category_id === null) {
      setForm((f) => ({ ...f, category_id: categories[0].id }));
    }
  }, [categories, form.category_id]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.createExpense({
        amount: Number(form.amount) * 1000,
        merchant: form.merchant,
        category_id: form.category_id,
        payment_method: form.payment_method,
      });
      toast.success("Expense added");
      setDialogOpen(false);
      setForm({
        amount: "",
        merchant: "",
        category_id: categories[0]?.id ?? null,
        payment_method: "cash",
      });
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Create failed");
    }
  }

  async function handleDelete(id: number) {
    try {
      await api.deleteExpense(id);
      toast.success("Expense deleted");
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    }
  }

  const total = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
  const filterLabel = filterUncategorized
    ? "Chưa phân loại"
    : filterCategoryId != null
      ? categories.find((c) => c.id === filterCategoryId)?.name ?? "Danh mục"
      : null;
  const overBudgetCategories = categories.filter((c) => c.is_over_budget);
  const spendingCategories = categories.filter(
    (c) => (c.month_spent ?? 0) > 0 || c.monthly_budget != null
  );

  return (
    <>
      <AppShell onOpenCommand={() => setCommandOpen(true)}>
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Finance
            </p>
            <h1 className="mt-2 text-4xl font-medium tracking-tighter">
              Spending ledger
            </h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setCategoryDialogOpen(true)}>
              <Tag className="size-4" />
              Thêm danh mục
            </Button>
            <Button variant="outline" onClick={() => setBudgetDialogOpen(true)}>
              <Settings2 className="size-4" />
              Ngân sách
            </Button>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="size-4" />
              Add expense
            </Button>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="border-white/10 bg-zinc-950">
              <DialogHeader>
                <DialogTitle>New expense</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid gap-2">
                  <Label>Amount (thousands)</Label>
                  <Input
                    type="number"
                    value={form.amount}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, amount: e.target.value }))
                    }
                    placeholder="65"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Merchant</Label>
                  <Input
                    value={form.merchant}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, merchant: e.target.value }))
                    }
                    placeholder="Com trua"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Category</Label>
                  <CategoryPicker
                    categories={categories}
                    value={form.category_id}
                    onChange={(categoryId) =>
                      setForm((f) => ({ ...f, category_id: categoryId }))
                    }
                  />
                </div>
                <Button type="submit" className="w-full">
                  Save expense
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {overBudgetCategories.length > 0 ? (
          <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4">
            <div className="mb-2 flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-4" />
              <span className="text-sm font-medium">Vượt ngân sách tháng</span>
            </div>
            <div className="space-y-1">
              {overBudgetCategories.map((category) => (
                <p key={category.id} className="text-sm text-destructive/90">
                  {category.name}: {formatCurrency(category.month_spent ?? 0)} /{" "}
                  {formatCurrency(category.monthly_budget ?? 0)}
                </p>
              ))}
            </div>
          </div>
        ) : null}

        <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
          <div className="space-y-6">
            <BentoCard
              title="Total listed"
              subtitle={filterLabel ? `Lọc: ${filterLabel}` : "Current page"}
            >
              <p className="font-mono text-4xl tracking-tight text-primary">
                {formatCurrency(total)}
              </p>
            </BentoCard>

            <BentoCard title="Chi tiêu theo danh mục" subtitle="Tháng này">
              <CategorySpendingList categories={spendingCategories} />
            </BentoCard>
          </div>

          <BentoCard
            title="Transactions"
            subtitle={filterLabel ? `Lọc: ${filterLabel}` : "Event-linked expenses"}
          >
            <div className="mb-4 space-y-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Lọc theo danh mục
              </p>
              <CategoryPicker
                categories={categories}
                value={filterUncategorized ? -1 : filterCategoryId}
                allowAll
                onChange={(categoryId) => {
                  setFilterUncategorized(false);
                  setFilterCategoryId(categoryId);
                }}
              />
              <button
                type="button"
                onClick={() => {
                  setFilterCategoryId(null);
                  setFilterUncategorized(true);
                }}
                className={cn(
                  "inline-flex items-center rounded-full border px-3 py-1.5 text-sm transition-all active:scale-[0.98]",
                  filterUncategorized
                    ? "border-primary/40 bg-primary/15 text-primary"
                    : "border-white/10 bg-white/5 text-muted-foreground hover:text-foreground"
                )}
              >
                Chưa phân loại
              </button>
            </div>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading expenses...
              </div>
            ) : expenses.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {filterLabel
                  ? `Không có chi phí nào trong danh mục "${filterLabel}".`
                  : "No expenses yet. Use Quick Add or add manually."}
              </p>
            ) : (
              <div className="space-y-2">
                {expenses.map((expense, index) => (
                  <motion.div
                    key={expense.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="flex items-center justify-between border-t border-white/5 py-3 first:border-t-0 first:pt-0"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {expense.merchant ?? "Expense"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {expense.category?.name ?? "Uncategorized"} ·{" "}
                        {formatDate(expense.event?.occurred_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-sm">
                        {formatCurrency(Number(expense.amount))}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingExpense(expense)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(expense.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </BentoCard>
        </div>
      </AppShell>

      <QuickAddCommand open={commandOpen} onOpenChange={setCommandOpen} />
      <CategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        onCreated={loadData}
      />
      <BudgetManagerDialog
        open={budgetDialogOpen}
        onOpenChange={setBudgetDialogOpen}
        categories={categories}
        onUpdated={loadData}
      />
      <ExpenseEditDialog
        expense={editingExpense}
        categories={categories}
        open={editingExpense !== null}
        onOpenChange={(open) => {
          if (!open) setEditingExpense(null);
        }}
        onSaved={loadData}
      />
    </>
  );
}
