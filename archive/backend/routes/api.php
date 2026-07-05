<?php

use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\QuickAddController;
use App\Http\Controllers\TaskController;
use App\Http\Middleware\VerifySupabaseToken;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware(VerifySupabaseToken::class)->group(function () {
    Route::get('/user', fn (Request $request) => $request->user());

    Route::get('/dashboard', DashboardController::class);

    Route::post('/quick-add/preview', [QuickAddController::class, 'preview']);
    Route::post('/quick-add', [QuickAddController::class, 'store']);

    Route::get('/categories', [CategoryController::class, 'index']);
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::put('/categories/{category}/budget', [CategoryController::class, 'updateBudget']);

    Route::get('/expenses/categories', [ExpenseController::class, 'categories']);
    Route::apiResource('expenses', ExpenseController::class)->except(['show']);

    Route::apiResource('tasks', TaskController::class)->except(['show']);
});

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'app' => config('app.name'),
    ]);
});
