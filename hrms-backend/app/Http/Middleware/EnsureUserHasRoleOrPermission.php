<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureUserHasRoleOrPermission
{
    public function handle(
        Request $request,
        Closure $next,
        ?string $role = null,
        ?string $permission = null
    ) {
        $user = $request->user('api');

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $requiredPermission = $permission ?: $role;

        if (
            $requiredPermission &&
            !$user->can($requiredPermission)
        ) {
            return response()->json([
                'success' => false,
                'message' => 'Forbidden: insufficient permission.',
            ], 403);
        }

        return $next($request);
    }
}
