<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ExpenseController extends Controller
{
    public function index(Request $request)
    {
        $expenses = Expense::query()
            ->with(['event', 'category'])
            ->whereHas('event', fn ($q) => $q->where('user_id', $request->user()->id))
            ->when($request->date, fn ($q, $date) => $q->whereHas('event', fn ($eq) => $eq->whereDate('occurred_at', $date)))
            ->when($request->filled('category_id'), fn ($q) => $q->where('category_id', $request->integer('category_id')))
            ->when($request->boolean('uncategorized'), fn ($q) => $q->whereNull('category_id'))
            ->latest()
            ->paginate(20);

        return response()->json($expenses);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0'],
            'category_id' => ['nullable', Rule::exists(ExpenseCategory::class, 'id')],
            'payment_method' => ['nullable', 'string', 'max:50'],
            'merchant' => ['nullable', 'string', 'max:255'],
            'note' => ['nullable', 'string', 'max:500'],
            'occurred_at' => ['nullable', 'date'],
        ]);

        $event = Event::create([
            'user_id' => $request->user()->id,
            'type' => 'expense',
            'source' => 'manual',
            'note' => $validated['note'] ?? null,
            'occurred_at' => $validated['occurred_at'] ?? now(),
        ]);

        $expense = Expense::create([
            'event_id' => $event->id,
            'category_id' => $validated['category_id'] ?? null,
            'amount' => $validated['amount'],
            'payment_method' => $validated['payment_method'] ?? 'cash',
            'merchant' => $validated['merchant'] ?? null,
        ]);

        return response()->json($expense->load(['event', 'category']), 201);
    }

    public function update(Request $request, Expense $expense)
    {
        $this->authorizeExpense($request, $expense);

        $validated = $request->validate([
            'amount' => ['sometimes', 'numeric', 'min:0'],
            'category_id' => ['nullable', Rule::exists(ExpenseCategory::class, 'id')],
            'payment_method' => ['nullable', 'string', 'max:50'],
            'merchant' => ['nullable', 'string', 'max:255'],
            'note' => ['nullable', 'string', 'max:500'],
            'occurred_at' => ['nullable', 'date'],
        ]);

        $expense->update(
            collect($validated)->only([
                'amount', 'category_id', 'payment_method', 'merchant',
            ])->filter(fn ($value) => $value !== '')->all()
        );

        if (isset($validated['note']) || isset($validated['occurred_at'])) {
            $expense->event->update([
                'note' => $validated['note'] ?? $expense->event->note,
                'occurred_at' => $validated['occurred_at'] ?? $expense->event->occurred_at,
            ]);
        }

        return response()->json($expense->fresh(['event', 'category']));
    }

    public function destroy(Request $request, Expense $expense)
    {
        $this->authorizeExpense($request, $expense);
        $expense->event?->delete();
        $expense->delete();

        return response()->json(['message' => 'Deleted.']);
    }

    public function categories()
    {
        return response()->json(
            \App\Models\ExpenseCategory::orderBy('name')->get()
        );
    }

    private function authorizeExpense(Request $request, Expense $expense): void
    {
        abort_unless(
            $expense->event?->user_id === $request->user()->id,
            403
        );
    }
}
