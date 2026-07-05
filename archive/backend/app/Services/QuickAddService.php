<?php

namespace App\Services;

use App\Models\Event;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\Task;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class QuickAddService
{
    public function __construct(private QuickAddParser $parser)
    {
    }

    public function preview(string $input): array
    {
        $parsed = $this->parser->parse($input);

        if (($parsed['preview']['category_id'] ?? null) !== null) {
            $category = ExpenseCategory::find($parsed['preview']['category_id']);
            $parsed['preview']['category'] = $category?->only(['id', 'name', 'icon', 'color']);
        }

        return $parsed;
    }

    public function save(
        User $user,
        string $input,
        ?array $override = null,
        ?string $intentOverride = null,
        ?array $previewPayload = null,
    ): array {
        $parsed = $this->parser->parse($input);
        $intent = $intentOverride ?? $override['intent'] ?? $parsed['intent'];

        $preview = array_merge(
            $parsed['preview'] ?? [],
            $previewPayload ?? [],
            $override ?? [],
        );

        unset($preview['category']);

        return DB::transaction(function () use ($user, $intent, $preview, $input) {
            $event = Event::create([
                'user_id' => $user->id,
                'type' => $intent,
                'source' => 'quick_add',
                'note' => $input,
                'occurred_at' => now(),
            ]);

            if ($intent === 'expense') {
                $expense = Expense::create([
                    'event_id' => $event->id,
                    'category_id' => $preview['category_id'] ?? null,
                    'amount' => $preview['amount'] ?? 0,
                    'payment_method' => $preview['payment_method'] ?? 'cash',
                    'merchant' => $preview['merchant'] ?? null,
                ]);

                return [
                    'intent' => 'expense',
                    'event_id' => $event->id,
                    'expense' => $expense->load('category'),
                ];
            }

            $task = Task::create([
                'user_id' => $user->id,
                'event_id' => $event->id,
                'title' => $preview['title'] ?? $input,
                'status' => $preview['status'] ?? 'pending',
                'due_at' => isset($preview['due_at']) ? Carbon::parse($preview['due_at']) : null,
            ]);

            return [
                'intent' => 'task',
                'event_id' => $event->id,
                'task' => $task,
            ];
        });
    }
}
