<?php

namespace App\Services;

use App\Models\Event;
use App\Models\Expense;
use App\Models\Task;
use App\Models\User;
use Carbon\Carbon;

class DashboardService
{
    public function __construct(private CategoryService $categories)
    {
    }

    public function forUser(User $user): array
    {
        $today = Carbon::today();
        $monthStart = Carbon::now()->startOfMonth();

        $todayExpenses = Expense::query()
            ->whereHas('event', fn ($q) => $q->where('user_id', $user->id)->whereDate('occurred_at', $today))
            ->sum('amount');

        $monthExpenses = Expense::query()
            ->whereHas('event', fn ($q) => $q->where('user_id', $user->id)->where('occurred_at', '>=', $monthStart))
            ->sum('amount');

        $pendingTasks = Task::query()
            ->where('user_id', $user->id)
            ->where('status', 'pending')
            ->count();

        $recentEvents = Event::query()
            ->with(['expense.category', 'task'])
            ->where('user_id', $user->id)
            ->latest('occurred_at')
            ->limit(8)
            ->get();

        $todayExpenseItems = Expense::query()
            ->with(['event', 'category'])
            ->whereHas('event', fn ($q) => $q->where('user_id', $user->id)->whereDate('occurred_at', $today))
            ->latest()
            ->limit(5)
            ->get();

        $upcomingTasks = Task::query()
            ->where('user_id', $user->id)
            ->where('status', 'pending')
            ->orderByRaw('due_at IS NULL, due_at ASC')
            ->limit(5)
            ->get();

        $categorySpending = $this->categories->monthSpendingByCategory($user);
        $totalBudget = $categorySpending
            ->whereNotNull('monthly_budget')
            ->sum('monthly_budget');

        $overBudgetCount = $categorySpending
            ->where('is_over_budget', true)
            ->count();

        return [
            'summary' => [
                'today_expense' => (float) $todayExpenses,
                'month_expense' => (float) $monthExpenses,
                'budget' => $totalBudget > 0 ? (float) $totalBudget : 10000000,
                'budget_remaining' => max(0, ($totalBudget > 0 ? $totalBudget : 10000000) - (float) $monthExpenses),
                'pending_tasks' => $pendingTasks,
                'over_budget_categories' => $overBudgetCount,
            ],
            'widgets' => [
                'today_expenses' => $todayExpenseItems,
                'tasks' => $upcomingTasks,
                'recent_events' => $recentEvents,
                'category_spending' => $categorySpending,
            ],
        ];
    }
}
