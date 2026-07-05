<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Task;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function index(Request $request)
    {
        $tasks = Task::query()
            ->with('event')
            ->where('user_id', $request->user()->id)
            ->when($request->status, fn ($q, $status) => $q->where('status', $status))
            ->orderByRaw('due_at IS NULL, due_at ASC')
            ->paginate(20);

        return response()->json($tasks);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'status' => ['nullable', 'in:pending,done'],
            'due_at' => ['nullable', 'date'],
        ]);

        $event = Event::create([
            'user_id' => $request->user()->id,
            'type' => 'task',
            'source' => 'manual',
            'note' => $validated['title'],
            'occurred_at' => now(),
        ]);

        $task = Task::create([
            'user_id' => $request->user()->id,
            'event_id' => $event->id,
            'title' => $validated['title'],
            'status' => $validated['status'] ?? 'pending',
            'due_at' => $validated['due_at'] ?? null,
        ]);

        return response()->json($task->load('event'), 201);
    }

    public function update(Request $request, Task $task)
    {
        abort_unless($task->user_id === $request->user()->id, 403);

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'status' => ['sometimes', 'in:pending,done'],
            'due_at' => ['nullable', 'date'],
        ]);

        $task->update($validated);

        return response()->json($task->fresh('event'));
    }

    public function destroy(Request $request, Task $task)
    {
        abort_unless($task->user_id === $request->user()->id, 403);
        $task->event?->delete();
        $task->delete();

        return response()->json(['message' => 'Deleted.']);
    }
}
