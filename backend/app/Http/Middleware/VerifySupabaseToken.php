<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class VerifySupabaseToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if (! $token) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $supabaseUrl = config('services.supabase.url');
        $serviceKey = config('services.supabase.service_role_key');

        if (! $supabaseUrl || ! $serviceKey) {
            return response()->json(['message' => 'Supabase is not configured.'], 500);
        }

        $response = Http::withHeaders([
            'apikey' => $serviceKey,
            'Authorization' => 'Bearer '.$token,
        ])->get(rtrim($supabaseUrl, '/').'/auth/v1/user');

        if (! $response->successful()) {
            return response()->json(['message' => 'Invalid token.'], 401);
        }

        $supabaseUser = $response->json();
        $email = $supabaseUser['email'] ?? null;

        if (! $email) {
            return response()->json(['message' => 'Invalid user payload.'], 401);
        }

        $user = User::firstOrCreate(
            ['supabase_id' => $supabaseUser['id']],
            [
                'email' => $email,
                'name' => $this->resolveName($supabaseUser),
                'avatar_url' => $supabaseUser['user_metadata']['avatar_url'] ?? null,
                'password' => null,
            ]
        );

        $user->fill([
            'email' => $email,
            'name' => $this->resolveName($supabaseUser),
            'avatar_url' => $supabaseUser['user_metadata']['avatar_url'] ?? $user->avatar_url,
        ])->save();

        $request->setUserResolver(fn () => $user);

        return $next($request);
    }

    private function resolveName(array $supabaseUser): string
    {
        $metadata = $supabaseUser['user_metadata'] ?? [];

        return $metadata['full_name']
            ?? $metadata['name']
            ?? Str::before($supabaseUser['email'], '@');
    }
}
