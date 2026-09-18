<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePasswordChanged
{
    public function handle(
        Request $request,
        Closure $next
    ): Response {

        $user = $request->user('api');

        if (
            $user?->must_change_password
            &&
            !$request->routeIs([
                'auth.change-password',
                'auth.logout',
            ])
        ) {
            return response()->json([
                'success' => false,
                'message' => 'Please change your temporary password before continuing.',
            ], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}
