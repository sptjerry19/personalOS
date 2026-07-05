<?php

namespace App\Http\Controllers;

use App\Services\QuickAddService;
use Illuminate\Http\Request;

class QuickAddController extends Controller
{
    public function __construct(private QuickAddService $quickAdd)
    {
    }

    public function preview(Request $request)
    {
        $validated = $request->validate([
            'input' => ['required', 'string', 'max:500'],
        ]);

        return response()->json($this->quickAdd->preview($validated['input']));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'input' => ['required', 'string', 'max:500'],
            'intent' => ['nullable', 'in:expense,task'],
            'preview' => ['nullable', 'array'],
            'override' => ['nullable', 'array'],
        ]);

        $result = $this->quickAdd->save(
            $request->user(),
            $validated['input'],
            $validated['override'] ?? null,
            $validated['intent'] ?? null,
            $validated['preview'] ?? null,
        );

        return response()->json($result, 201);
    }
}
