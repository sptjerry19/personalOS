"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AppShell } from "@/components/layout/app-shell";
import { BentoCard } from "@/components/dashboard/bento";
import { QuickAddCommand } from "@/components/quick-add/command-palette";
import { api } from "@/lib/api";
import type { Task } from "@/types";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function TasksView() {
  const [commandOpen, setCommandOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");

  async function loadTasks() {
    setLoading(true);
    try {
      const response = await api.getTasks();
      setTasks(response.data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await api.createTask({ title });
      setTitle("");
      toast.success("Task created");
      loadTasks();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Create failed");
    }
  }

  async function toggleTask(task: Task) {
    try {
      await api.updateTask(task.id, {
        status: task.status === "done" ? "pending" : "done",
      });
      loadTasks();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    }
  }

  async function handleDelete(id: number) {
    try {
      await api.deleteTask(id);
      toast.success("Task deleted");
      loadTasks();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    }
  }

  const pending = tasks.filter((t) => t.status === "pending").length;

  return (
    <>
      <AppShell onOpenCommand={() => setCommandOpen(true)}>
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Tasks
          </p>
          <h1 className="mt-2 text-4xl font-medium tracking-tighter">
            Focus queue
          </h1>
        </div>

        <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
          <BentoCard title="Queue status" subtitle="Pending items">
            <p className="font-mono text-4xl tracking-tight text-primary">
              {pending}
            </p>
            <form onSubmit={handleCreate} className="mt-6 space-y-3">
              <div className="grid gap-2">
                <Label htmlFor="task-title">Quick task</Label>
                <Input
                  id="task-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Goi dien nuoc"
                />
              </div>
              <Button type="submit" className="w-full">
                <Plus className="size-4" />
                Add task
              </Button>
            </form>
          </BentoCard>

          <BentoCard title="All tasks" subtitle="Tap to complete">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading tasks...
              </div>
            ) : tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No tasks yet. Add one above or use Ctrl+K.
              </p>
            ) : (
              <div className="space-y-2">
                {tasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="flex items-center justify-between border-t border-white/5 py-3 first:border-t-0 first:pt-0"
                  >
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-8 rounded-full"
                        onClick={() => toggleTask(task)}
                      >
                        <Check
                          className={
                            task.status === "done" ? "text-primary" : "opacity-30"
                          }
                        />
                      </Button>
                      <div>
                        <p
                          className={
                            task.status === "done"
                              ? "text-sm text-muted-foreground line-through"
                              : "text-sm text-foreground"
                          }
                        >
                          {task.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(task.due_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="capitalize">
                        {task.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(task.id)}
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
    </>
  );
}
