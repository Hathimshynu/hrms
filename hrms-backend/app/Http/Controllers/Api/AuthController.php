<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Http\Requests\Auth\GoogleLoginRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Client\ConnectionException;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\Response;
use Tymon\JWTAuth\Exceptions\JWTException;
use Tymon\JWTAuth\Facades\JWTAuth;
use Illuminate\Support\Str;
use App\Models\Role;
use App\Models\LoginSession;

class AuthController extends Controller
{
    /** Seconds during which a just-rotated refresh token is treated as a benign concurrent-tab race. */
    private const REFRESH_RACE_SECONDS = 15;

    public function login(LoginRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $user = User::with('role')
            ->where('email', $validated['email'])
            ->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid email or password.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        if (!$user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Your account is inactive.',
            ], Response::HTTP_FORBIDDEN);
        }

        $rememberMe = (bool) ($validated['remember_me'] ?? false);

        return $this->authenticatedResponse($user, $rememberMe, 'password');
    }

    public function googleLogin(GoogleLoginRequest $request): JsonResponse
    {
        $validated = $request->validated();

        try {
            $response = Http::timeout(10)->get(
                'https://oauth2.googleapis.com/tokeninfo',
                [
                    'id_token' => $validated['id_token'],
                ]
            );

            if (!$response->successful()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid Google token.',
                ], Response::HTTP_UNAUTHORIZED);
            }

            $google = $response->json();

            /*
        |--------------------------------------------------------------------------
        | Verify Google OAuth client
        |--------------------------------------------------------------------------
        */

            if (
                empty($google['sub']) ||
                empty($google['email']) ||
                empty($google['aud']) ||
                $google['aud'] !== config('services.google.client_id')
            ) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid Google authentication.',
                ], Response::HTTP_UNAUTHORIZED);
            }

            /*
        |--------------------------------------------------------------------------
        | Verify issuer
        |--------------------------------------------------------------------------
        */

            if (
                !in_array(
                    $google['iss'] ?? null,
                    [
                        'accounts.google.com',
                        'https://accounts.google.com',
                    ],
                    true
                )
            ) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid Google token issuer.',
                ], Response::HTTP_UNAUTHORIZED);
            }

            /*
        |--------------------------------------------------------------------------
        | Verify expiration
        |--------------------------------------------------------------------------
        */

            if (
                empty($google['exp']) ||
                now()->timestamp >= (int) $google['exp']
            ) {
                return response()->json([
                    'success' => false,
                    'message' => 'Google token has expired.',
                ], Response::HTTP_UNAUTHORIZED);
            }

            /*
        |--------------------------------------------------------------------------
        | Verify email
        |--------------------------------------------------------------------------
        */

            if (($google['email_verified'] ?? 'false') !== 'true') {
                return response()->json([
                    'success' => false,
                    'message' => 'Google email is not verified.',
                ], Response::HTTP_UNAUTHORIZED);
            }

            $email = strtolower(trim($google['email']));
            $googleId = $google['sub'];

            /*
        |--------------------------------------------------------------------------
        | Find existing user
        |--------------------------------------------------------------------------
        */

            $user = User::where('email', $email)
                ->orWhere('google_id', $googleId)
                ->first();

            /*
        |--------------------------------------------------------------------------
        | Create user if not found
        |--------------------------------------------------------------------------
        */

            if (!$user) {
                // Google sign-in only works for accounts an administrator has
                // already created; it never provisions new HRMS accounts.
                return response()->json([
                    'success' => false,
                    'message' => 'No HRMS account is associated with this Google account. Please contact your administrator.',
                ], Response::HTTP_FORBIDDEN);
            } else {

                /*
            |--------------------------------------------------------------------------
            | Existing account
            |--------------------------------------------------------------------------
            */

                if (!$user->is_active) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Your account is inactive.',
                    ], Response::HTTP_FORBIDDEN);
                }

                /*
            |--------------------------------------------------------------------------
            | Link Google account
            |--------------------------------------------------------------------------
            */

                if ($user->google_id && $user->google_id !== $googleId) {
                    return response()->json([
                        'success' => false,
                        'message' => 'This account is linked to a different Google account.',
                    ], Response::HTTP_FORBIDDEN);
                }

                if (!$user->google_id) {
                    $user->update([
                        'google_id' => $googleId,
                        'google_avatar' => $google['picture'] ?? $user->google_avatar,
                    ]);
                }
            }

            /*
        |--------------------------------------------------------------------------
        | Remember Me
        |--------------------------------------------------------------------------
        */

            $rememberMe = (bool) (
                $validated['remember_me'] ?? false
            );

            /*
        |--------------------------------------------------------------------------
        | Use SAME authentication response
        |--------------------------------------------------------------------------
        */

            return $this->authenticatedResponse(
                $user->fresh()->load('role'),
                $rememberMe,
                'google'
            );
        } catch (\Throwable $e) {

            Log::error('Google authentication failed.', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Google authentication failed.',
            ], Response::HTTP_UNAUTHORIZED);
        }
    }

    public function logout(): JsonResponse
    {
        try {

            $token = JWTAuth::getToken();

            if ($token) {

                $payload = JWTAuth::setToken($token)
                    ->getPayload();

                $jti = $payload->get('jti');

                $user = auth('api')->user();

                if ($user) {

                    $user->loginSessions()
                        ->where('jti', $jti)
                        ->update([
                            'is_active' => false,
                            'logged_out_at' => now(),
                        ]);

                    $user->increment('token_version');
                }

                JWTAuth::invalidate($token);
            }

            return response()->json([
                'success' => true,
                'message' => 'Logged out successfully.',
            ])->withoutCookie(
                config('jwt.auth_cookie_name', 'hrms_auth')
            )->withoutCookie(
                config('jwt.refresh_cookie_name'),
                '/api/refresh',
                config('jwt.auth_cookie_domain')
            );
        } catch (JWTException $e) {

            return response()->json([
                'success' => false,
                'message' => 'Logout failed.',
            ], Response::HTTP_UNAUTHORIZED);
        }
    }

    public function me(): JsonResponse
    {
        return response()->json(UserResource::make(auth('api')->user())->resolve());
    }

    /**
     * Exchange a refresh token for a new access token (and a rotated refresh
     * token). The refresh token is an opaque random secret, stored only as a
     * SHA-256 hash on the login session:
     *  - web sends it in the HttpOnly `hrms_refresh` cookie (path /api/refresh);
     *  - native clients (X-Client-Type: mobile) send it as `refresh_token`.
     * The expired access token is NOT a refresh credential.
     *
     * Rotation: every use retires the presented token. Presenting a token that
     * was already rotated revokes the user's sessions (theft signal), except
     * within a short race window where a concurrent tab already rotated it.
     */
    public function refresh(Request $request): JsonResponse
    {
        $raw = $request->input('refresh_token');

        if (! is_string($raw) || $raw === '') {
            $raw = $request->cookie(config('jwt.refresh_cookie_name'));
        }

        if (! is_string($raw) || strlen($raw) < 32) {
            return $this->refreshFailure('Refresh token is required.', 'REFRESH_TOKEN_MISSING');
        }

        $hash = hash('sha256', $raw);
        $native = $this->isNativeClient($request);

        $result = DB::transaction(function () use ($hash) {
            $session = LoginSession::where('refresh_token_hash', $hash)->lockForUpdate()->first();

            if (! $session) {
                return ['error' => ['Invalid refresh token.', 'REFRESH_TOKEN_INVALID', Response::HTTP_UNAUTHORIZED]];
            }

            $user = User::find($session->user_id);

            if (! $session->is_active) {
                if ($session->rotated_at && $session->rotated_at->gt(now()->subSeconds(self::REFRESH_RACE_SECONDS))) {
                    return ['error' => ['Refresh token was just rotated. Retry the request.', 'REFRESH_RACE', Response::HTTP_CONFLICT]];
                }

                if ($session->rotated_at && $user) {
                    // Reuse of an already-rotated token: assume theft, end every session.
                    $user->loginSessions()->where('is_active', true)->update(['is_active' => false, 'logged_out_at' => now()]);
                    $user->increment('token_version');
                }

                return ['error' => ['Refresh token is no longer valid. Please log in again.', 'REFRESH_TOKEN_REUSED', Response::HTTP_UNAUTHORIZED]];
            }

            if (! $session->refresh_expires_at || $session->refresh_expires_at->lte(now())) {
                $session->update(['is_active' => false, 'logged_out_at' => now()]);

                return ['error' => ['Refresh window expired. Please log in again.', 'REFRESH_WINDOW_EXPIRED', Response::HTTP_UNAUTHORIZED]];
            }

            if (! $user || ! $user->is_active) {
                return ['error' => ['User account is unavailable.', 'ACCOUNT_INACTIVE', Response::HTTP_UNAUTHORIZED]];
            }

            $accessToken = JWTAuth::fromUser($user);
            $newJti = JWTAuth::setToken($accessToken)->getPayload()->get('jti');
            $newRefresh = bin2hex(random_bytes(32));

            $session->update(['is_active' => false, 'rotated_at' => now()]);

            $user->loginSessions()->create([
                'jti' => $newJti,
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'logged_in_at' => now(),
                'expires_at' => now()->addMinutes(config('jwt.ttl')),
                'is_active' => true,
                'provider' => $session->provider,
                'remember' => $session->remember,
                'refresh_token_hash' => hash('sha256', $newRefresh),
                // Absolute window: rotation never extends the original login's refresh lifetime.
                'refresh_expires_at' => $session->refresh_expires_at,
            ]);

            return [
                'access' => $accessToken,
                'refresh' => $newRefresh,
                'remember' => (bool) $session->remember,
                'refresh_expires_at' => $session->refresh_expires_at,
            ];
        });

        if (isset($result['error'])) {
            [$message, $code, $status] = $result['error'];

            return $this->refreshFailure($message, $code, $status);
        }

        $data = [
            'access_token' => $result['access'],
            'expires_in' => config('jwt.ttl') * 60,
        ];

        if ($native) {
            $data['refresh_token'] = $result['refresh'];
        }

        return response()->json([
            'success' => true,
            'message' => 'Token refreshed successfully.',
            'data' => $data,
        ])->cookie($this->authCookie($result['access'], $result['remember']))
            ->cookie($this->refreshCookie($result['refresh'], $result['remember'], $result['refresh_expires_at']));
    }

    private function refreshFailure(string $message, string $code, int $status = Response::HTTP_UNAUTHORIZED): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'error' => $code,
        ], $status);
    }

    private function isNativeClient(Request $request): bool
    {
        return strtolower((string) $request->header('X-Client-Type')) === 'mobile';
    }

    /**
     * HttpOnly, scoped to the refresh endpoint only so it is never sent with
     * ordinary API calls.
     */
    private function refreshCookie(string $token, bool $remember, ?Carbon $expiresAt = null)
    {
        $minutes = $remember && $expiresAt ? max(1, (int) now()->diffInMinutes($expiresAt, false)) : 0;

        return cookie(
            config('jwt.refresh_cookie_name'),
            $token,
            $minutes,
            '/api/refresh',
            config('jwt.auth_cookie_domain'),
            config('jwt.auth_cookie_secure'),
            true,
            false,
            config('jwt.auth_cookie_same_site')
        );
    }

    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $user = auth('api')->user();

        if (!Hash::check($request->string('current_password')->toString(), $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Current password is incorrect.',
                'errors' => [
                    'current_password' => ['The current password you entered is incorrect.'],
                ],
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $user->password = Hash::make($request->string('new_password')->toString());
        $user->must_change_password = false;
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully. You can now access your account.',
        ], Response::HTTP_OK);
    }

    /**
     * @param  array<string, mixed>  $identity
     */
    private function isValidGoogleIdentity(array $identity, string $clientId): bool
    {
        return isset($identity['sub'], $identity['email'], $identity['aud'], $identity['iss'], $identity['exp'])
            && hash_equals($clientId, (string) $identity['aud'])
            && in_array($identity['iss'], ['accounts.google.com', 'https://accounts.google.com'], true)
            && filter_var($identity['email_verified'] ?? false, FILTER_VALIDATE_BOOL)
            && (int) $identity['exp'] > now()->timestamp;
    }

    private function authenticatedResponse(User $user, bool $rememberMe = false, string $provider = 'password'): JsonResponse
    {
        $user->loginSessions()
            ->where('is_active', true)
            ->update([
                'is_active' => false,
                'logged_out_at' => now(),
            ]);

        $user->increment('token_version');

        $token = JWTAuth::fromUser($user);

        $payload = JWTAuth::setToken($token)
            ->getPayload();

        $jti = $payload->get('jti');

        $expiresAt = now()->addMinutes(
            config('jwt.ttl')
        );

        // Opaque refresh token; only its SHA-256 hash is persisted.
        $refreshToken = bin2hex(random_bytes(32));
        $refreshExpiresAt = now()->addMinutes((int) config('jwt.refresh_ttl'));

        $user->update([
            'last_login_at' => now(),
            'last_login_ip' => request()->ip(),
        ]);

        $user->loginSessions()->create([
            'jti' => $jti,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'logged_in_at' => now(),
            'expires_at' => $expiresAt,
            'is_active' => true,
            'provider' => $provider,
            'remember' => $rememberMe,
            'refresh_token_hash' => hash('sha256', $refreshToken),
            'refresh_expires_at' => $refreshExpiresAt,
        ]);

        $data = [
            'user' => new UserResource($user->load('role')),
            // Web relies on the httpOnly cookies below; the access token is also returned
            // for native clients, which send it as `Authorization: Bearer`.
            'access_token' => $token,
            'expires_in' => config('jwt.ttl') * 60,
            'provider' => $provider,
            'remember_me' => $rememberMe,
        ];

        // The refresh token is only put in the body for native clients (secure storage);
        // browsers get it solely as an HttpOnly cookie scoped to /api/refresh.
        if (request() && $this->isNativeClient(request())) {
            $data['refresh_token'] = $refreshToken;
        }

        return response()->json([
            'success' => true,
            'message' => 'Login successful.',
            'data' => $data,
        ])->cookie($this->authCookie($token, $rememberMe))
            ->cookie($this->refreshCookie($refreshToken, $rememberMe, $refreshExpiresAt));
    }

    private function authCookie(string $token, bool $remember = false)
    {
        $minutes = $remember ? config('jwt.refresh_ttl') : 0;

        return cookie(
            config('jwt.auth_cookie_name'),
            $token,
            $minutes,
            '/',
            config('jwt.auth_cookie_domain'),
            config('jwt.auth_cookie_secure'),
            config('jwt.auth_cookie_http_only'),
            false,
            config('jwt.auth_cookie_same_site')
        );
    }
}
