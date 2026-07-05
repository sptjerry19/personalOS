<?php

namespace Database\Seeders;

use App\Models\ExpenseCategory;
use Illuminate\Database\Seeder;

class ExpenseCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Food', 'icon' => 'utensils', 'color' => '#10b981'],
            ['name' => 'Transport', 'icon' => 'car', 'color' => '#3b82f6'],
            ['name' => 'Shopping', 'icon' => 'shopping-bag', 'color' => '#f59e0b'],
            ['name' => 'Bills', 'icon' => 'receipt', 'color' => '#ef4444'],
            ['name' => 'Health', 'icon' => 'heart', 'color' => '#ec4899'],
            ['name' => 'Entertainment', 'icon' => 'film', 'color' => '#8b5cf6'],
            ['name' => 'Other', 'icon' => 'dots-three', 'color' => '#71717a'],
        ];

        foreach ($categories as $category) {
            ExpenseCategory::firstOrCreate(['name' => $category['name']], $category);
        }
    }
}
