<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AddJwtCookieToRequest
{
    public function handle(Request $request, Closure $next): Response
    {
        $cookieName = config('jwt.auth_cookie_name', 'hrms_auth');
        $cookieToken = $request->cookie($cookieName);

        if (!$request->bearerToken() && $cookieToken) {
            $cookieToken = trim(rawurldecode($cookieToken), '"');
            $request->headers->set('Authorization', 'Bearer '.$cookieToken);
        }

        return $next($request);
    }
}