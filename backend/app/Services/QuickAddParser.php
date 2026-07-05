<?php

namespace App\Services;

use App\Models\ExpenseCategory;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class QuickAddParser
{
    public function parse(string $input): array
    {
        $text = trim(mb_strtolower($input));

        if ($text === '') {
            return ['intent' => 'unknown', 'confidence' => 0, 'preview' => null];
        }

        if (preg_match('/^(task|todo|việc)\s*[:\-]?\s*(.+)$/u', $text, $matches)) {
            return [
                'intent' => 'task',
                'confidence' => 0.95,
                'preview' => [
                    'title' => trim($matches[2]),
                    'status' => 'pending',
                ],
            ];
        }

        if (preg_match('/(\d+(?:[.,]\d+)?)\s*(k|nghìn|ngan)?/u', $text, $amountMatch)) {
            $amount = (float) str_replace(',', '.', $amountMatch[1]);
            if (in_array($amountMatch[2] ?? '', ['k', 'nghìn', 'ngan'], true)) {
                $amount *= 1000;
            } elseif ($amount < 1000) {
                $amount *= 1000;
            }

            $merchant = trim(preg_replace('/(\d+(?:[.,]\d+)?)\s*(k|nghìn|ngan)?/u', '', $text));
            $merchant = $merchant !== '' ? $merchant : 'Chi tieu';

            return [
                'intent' => 'expense',
                'confidence' => 0.9,
                'preview' => [
                    'amount' => round($amount, 2),
                    'merchant' => ucfirst($merchant),
                    'category_id' => $this->guessCategoryId($text),
                    'payment_method' => 'cash',
                ],
            ];
        }

        return [
            'intent' => 'task',
            'confidence' => 0.6,
            'preview' => [
                'title' => ucfirst($input),
                'status' => 'pending',
            ],
        ];
    }

    private function guessCategoryId(string $text): ?int
    {
        $rules = [
            'Food' => ['an', 'cafe', 'coffee', 'trua', 'toi', 'sang', 'nuoc', 'com', 'pho', 'banh'],
            'Transport' => ['xe', 'grab', 'bus', 'taxi', 'xang', 'grab'],
            'Shopping' => ['mua', 'shop', 'market', 'thi'],
            'Bills' => ['dien', 'nuoc', 'wifi', 'internet', 'tien nha'],
            'Health' => ['thuoc', 'benh', 'kham'],
            'Entertainment' => ['phim', 'game', 'netflix'],
        ];

        foreach ($rules as $categoryName => $keywords) {
            foreach ($keywords as $keyword) {
                if (str_contains($text, $keyword)) {
                    return ExpenseCategory::where('name', $categoryName)->value('id');
                }
            }
        }

        return ExpenseCategory::where('name', 'Other')->value('id');
    }
}
