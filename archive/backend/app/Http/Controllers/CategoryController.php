<?php

namespace App\Http\Controllers;

use App\Models\ExpenseCategory;
use App\Services\CategoryService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    public function __construct(private CategoryService $categories)
    {
    }

    public function index(Request $request)
    {
        return response()->json(
            $this->categories->listForUser($request->user())
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100', 'unique:expense_categories,name'],
            'icon' => ['nullable', 'string', 'max:50'],
            'color' => ['nullable', 'string', 'max:20'],
        ]);

        $category = ExpenseCategory::create([
            'name' => $validated['name'],
            'icon' => $validated['icon'] ?? 'receipt',
            'color' => $validated['color'] ?? '#71717a',
        ]);

        return response()->json(
            $this->categories->listForUser($request->user())
                ->firstWhere('id', $category->id),
            201
        );
    }

    public function updateBudget(Request $request, ExpenseCategory $category)
    {
        $validated = $request->validate([
            'monthly_budget' => ['nullable', 'numeric', 'min:0'],
        ]);

        $result = $this->categories->setBudget(
            $request->user(),
            $category->id,
            isset($validated['monthly_budget']) ? (float) $validated['monthly_budget'] : null,
        );

        return response()->json($result);
    }
}
