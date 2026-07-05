<?php

namespace App\Services;

use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\User;
use App\Models\UserCategoryBudget;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class CategoryService
{
    public function listForUser(User $user): Collection
    {
        $monthStart = Carbon::now()->startOfMonth();

        $categories = ExpenseCategory::orderBy('name')->get();

        $budgets = UserCategoryBudget::query()
            ->where('user_id', $user->id)
            ->pluck('monthly_budget', 'category_id');

        $spent = Expense::query()
            ->selectRaw('category_id, SUM(amount) as total')
            ->whereHas('event', fn ($q) => $q
                ->where('user_id', $user->id)
                ->where('occurred_at', '>=', $monthStart))
            ->groupBy('category_id')
            ->pluck('total', 'category_id');

        return $categories->map(function (ExpenseCategory $category) use ($budgets, $spent) {
            $monthSpent = (float) ($spent[$category->id] ?? 0);
            $monthlyBudget = isset($budgets[$category->id])
                ? (float) $budgets[$category->id]
                : null;

            return [
                'id' => $category->id,
                'name' => $category->name,
                'icon' => $category->icon,
                'color' => $category->color,
                'monthly_budget' => $monthlyBudget,
                'month_spent' => $monthSpent,
                'is_over_budget' => $monthlyBudget !== null && $monthSpent > $monthlyBudget,
            ];
        });
    }

    public function monthSpendingByCategory(User $user): Collection
    {
        return $this->listForUser($user)
            ->filter(fn (array $category) => $category['month_spent'] > 0 || $category['monthly_budget'] !== null)
            ->values();
    }

    public function setBudget(User $user, int $categoryId, ?float $monthlyBudget): array
    {
        if ($monthlyBudget === null || $monthlyBudget <= 0) {
            UserCategoryBudget::query()
                ->where('user_id', $user->id)
                ->where('category_id', $categoryId)
                ->delete();
        } else {
            UserCategoryBudget::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'category_id' => $categoryId,
                ],
                ['monthly_budget' => $monthlyBudget]
            );
        }

        return $this->listForUser($user)
            ->firstWhere('id', $categoryId);
    }
}
