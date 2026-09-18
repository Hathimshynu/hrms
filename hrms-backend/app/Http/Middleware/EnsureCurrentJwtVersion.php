<?php

namespace App\Http\Middleware;

use App\Models\LoginSession;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Tymon\JWTAuth\Facades\JWTAuth;

class EnsureCurrentJwtVersion
{
    public function handle(
        Request $request,
        Closure $next
    ): Response {
        $user = $request->user('api');

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        $payload = JWTAuth::parseToken()->getPayload();

        /*
        |--------------------------------------------------------------------------
        | Token version
        |--------------------------------------------------------------------------
        */

        if (
            (int) $payload->get('token_version', -1)
            !==
            (int) $user->token_version
        ) {
            return response()->json([
                'success' => false,
                'message' => 'Token has been revoked. Please log in again.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        /*
        |--------------------------------------------------------------------------
        | Current login session
        |--------------------------------------------------------------------------
        */

        $session = LoginSession::where('user_id', $user->id)
            ->where('jti', $payload->get('jti'))
            ->where('is_active', true)
            ->where(function ($query) {
                $query
                    ->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->exists();

        if (!$session) {
            return response()->json([
                'success' => false,
                'message' => 'Login session is no longer active. Please log in again.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        return $next($request);
    }
}