"use client";

import { motion } from "framer-motion";
import { cn, formatCurrency } from "@/lib/utils";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 100, damping: 20 },
  },
};

export function BentoCard({
  title,
  subtitle,
  children,
  className,
  delay = 0,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.section
      variants={item}
      custom={delay}
      className={cn(
        "glass-panel rounded-[2rem] p-6 md:p-8",
        className
      )}
    >
      <div className="mb-5">
        <h2 className="text-sm font-medium tracking-tight text-foreground">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </motion.section>
  );
}

export function MetricValue({
  label,
  value,
  hint,
  accent = false,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "font-mono text-3xl tracking-tight md:text-4xl",
          accent ? "text-primary" : "text-foreground"
        )}
      >
        {value}
      </p>
      {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function BentoGrid({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-5 md:grid-cols-12 md:gap-6"
    >
      {children}
    </motion.div>
  );
}

export function BudgetBar({
  spent,
  budget,
}: {
  spent: number;
  budget: number;
}) {
  const pct = Math.min(100, Math.round((spent / budget) * 100));

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-4">
        <MetricValue
          label="Month spend"
          value={formatCurrency(spent)}
          hint={`${pct}% of ${formatCurrency(budget)}`}
        />
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="h-full rounded-full bg-primary"
        />
      </div>
    </div>
  );
}
