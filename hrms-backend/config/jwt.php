<?php

use Tymon\JWTAuth\Providers\Auth\Illuminate;
use Tymon\JWTAuth\Providers\JWT\Lcobucci;

return [
    'secret' => env('JWT_SECRET'),
    'keys' => [
        'public' => env('JWT_PUBLIC_KEY'),
        'private' => env('JWT_PRIVATE_KEY'),
        'passphrase' => env('JWT_PASSPHRASE', ''),
    ],
    'ttl' => (int) env('JWT_TTL', 60),
    'refresh_ttl' => (int) env('JWT_REFRESH_TTL', 20160),
    'algo' => env('JWT_ALGO', 'HS256'),
    'required_claims' => ['iss', 'iat', 'exp', 'nbf', 'sub', 'jti'],
    'persistent_claims' => [],
    'lock_subject' => true,
    'leeway' => env('JWT_LEEWAY', 0),
    'blacklist_enabled' => env('JWT_BLACKLIST_ENABLED', true),
    'blacklist_grace_period' => env('JWT_BLACKLIST_GRACE_PERIOD', 0),
    'decrypt_cookies' => false,
    'cookie' => [
        'domain' => env('JWT_COOKIE_DOMAIN'),
        'secure' => filter_var(env('JWT_COOKIE_SECURE', false), FILTER_VALIDATE_BOOL),
        'same_site' => env('JWT_COOKIE_SAME_SITE', 'lax'),
    ],
    'auth_cookie_name' => env(
        'JWT_AUTH_COOKIE',
        'hrms_auth'
    ),

    'auth_cookie_domain' => env(
        'JWT_AUTH_COOKIE_DOMAIN',
        null
    ),

    'auth_cookie_secure' => env(
        'JWT_AUTH_COOKIE_SECURE',
        true
    ),

    'auth_cookie_http_only' => env(
        'JWT_AUTH_COOKIE_HTTP_ONLY',
        true
    ),

    'auth_cookie_same_site' => env(
        'JWT_AUTH_COOKIE_SAME_SITE',
        'lax'
    ),
    'providers' => [
        'jwt' => Lcobucci::class,
        'auth' => Illuminate::class,
        'storage' => Tymon\JWTAuth\Providers\Storage\Illuminate::class,
    ],
];
