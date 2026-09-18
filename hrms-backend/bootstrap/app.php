<?php

use App\Http\Middleware\AddJwtCookieToRequest;
use App\Http\Middleware\EnsureCurrentJwtVersion;
use App\Http\Middleware\EnsurePasswordChanged;
use App\Http\Middleware\EnsureUserHasRoleOrPermission;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;
use Tymon\JWTAuth\Facades\JWTAuth;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__ . '/../routes/api.php',
        web: __DIR__ . '/../routes/web.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )

    ->withMiddleware(function (Middleware $middleware): void {

        $middleware->redirectGuestsTo(
            fn(Request $request) => $request->is('api/*') ? null : route('login')
        );

        $middleware->alias([
            'permission' => EnsureUserHasRoleOrPermission::class,
            'jwt.cookie' => AddJwtCookieToRequest::class,
            'jwt.current' => EnsureCurrentJwtVersion::class,
            'password.changed' => EnsurePasswordChanged::class,
        ]);

        /*
        |--------------------------------------------------------------------------
        | JWT Cookie MUST run before auth:api
        |--------------------------------------------------------------------------
        */

        $middleware->prependToPriorityList(
            before: \Illuminate\Contracts\Auth\Middleware\AuthenticatesRequests::class,
            prepend: AddJwtCookieToRequest::class,
        );
    })

    ->withExceptions(function (Exceptions $exceptions): void {

        $exceptions->shouldRenderJsonWhen(
            fn(Request $request) => $request->is('api/*') || $request->expectsJson()
        );

        $exceptions->renderable(function (\Throwable $exception, Request $request) {

            if (!$request->is('api/*')) {
                return null;
            }

            /*
        |--------------------------------------------------------------------------
        | Authentication exception
        |--------------------------------------------------------------------------
        */

            if ($exception instanceof AuthenticationException) {

                try {
                    JWTAuth::parseToken()->getPayload();

                    return response()->json([
                        'success' => false,
                        'message' => 'Unauthenticated.',
                        'error' => 'UNAUTHENTICATED',
                    ], 401);
                } catch (\Tymon\JWTAuth\Exceptions\TokenExpiredException $e) {

                    return response()->json([
                        'success' => false,
                        'message' => 'Access token expired. Please refresh your session.',
                        'error' => 'TOKEN_EXPIRED',
                    ], 401);
                } catch (\Tymon\JWTAuth\Exceptions\TokenInvalidException $e) {

                    return response()->json([
                        'success' => false,
                        'message' => 'Invalid access token. Please log in again.',
                        'error' => 'TOKEN_INVALID',
                    ], 401);
                } catch (\Tymon\JWTAuth\Exceptions\JWTException $e) {

                    return response()->json([
                        'success' => false,
                        'message' => 'Authentication token is missing or invalid.',
                        'error' => 'TOKEN_MISSING_OR_INVALID',
                    ], 401);
                }
            }

            /*
        |--------------------------------------------------------------------------
        | JWT unauthorized exception
        |--------------------------------------------------------------------------
        */

            if ($exception instanceof UnauthorizedHttpException) {

                $previous = $exception->getPrevious();

                if ($previous instanceof \Tymon\JWTAuth\Exceptions\TokenExpiredException) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Access token expired. Please refresh your session.',
                        'error' => 'TOKEN_EXPIRED',
                    ], 401);
                }

                if ($previous instanceof \Tymon\JWTAuth\Exceptions\TokenInvalidException) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Invalid access token. Please log in again.',
                        'error' => 'TOKEN_INVALID',
                    ], 401);
                }

                return response()->json([
                    'success' => false,
                    'message' => 'Authentication token is invalid. Please log in again.',
                    'error' => 'TOKEN_INVALID',
                ], 401);
            }

            /*
        |--------------------------------------------------------------------------
        | Model Not Found
        |--------------------------------------------------------------------------
        */

            $modelNotFound = $exception instanceof ModelNotFoundException
                ? $exception
                : (
                    $exception instanceof NotFoundHttpException
                    && $exception->getPrevious() instanceof ModelNotFoundException
                    ? $exception->getPrevious()
                    : null
                );

            if ($modelNotFound instanceof ModelNotFoundException) {
                return response()->json([
                    'success' => false,
                    'message' => class_basename($modelNotFound->getModel()) . ' not found.',
                    'error' => 'NOT_FOUND',
                ], 404);
            }

            return null;
        });
    })

    ->create();
