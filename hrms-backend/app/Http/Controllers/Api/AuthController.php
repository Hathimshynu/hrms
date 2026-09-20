<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Http\Requests\Auth\GoogleLoginRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\JsonResponse;
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

    public function refresh(): JsonResponse
    {
        try {
            $oldToken = JWTAuth::getToken();

            if (!$oldToken) {
                return response()->json([
                    'success' => false,
                    'message' => 'Authentication cookie is required.',
                    'error' => 'TOKEN_MISSING',
                ], Response::HTTP_UNAUTHORIZED);
            }

            /*
        |--------------------------------------------------------------------------
        | Get the current login session BEFORE refreshing
        |--------------------------------------------------------------------------
        */

            $sessions = LoginSession::where('is_active', true)
                ->where('expires_at', '>', now())
                ->get();

            $matchedSession = null;
            $user = null;

            /*
        |--------------------------------------------------------------------------
        | Decode token claims without authenticating the expired token
        |--------------------------------------------------------------------------
        |
        | The JWT payload contains the user ID and JTI.
        | We need these only to identify the existing login session.
        |
        */

            $parts = explode('.', $oldToken);

            if (count($parts) !== 3) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid authentication token.',
                    'error' => 'TOKEN_INVALID',
                ], Response::HTTP_UNAUTHORIZED);
            }

            $payload = json_decode(
                base64_decode(
                    strtr($parts[1], '-_', '+/')
                ),
                true
            );

            if (!is_array($payload)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid authentication token.',
                    'error' => 'TOKEN_INVALID',
                ], Response::HTTP_UNAUTHORIZED);
            }

            $userId = $payload['sub'] ?? null;
            $oldJti = $payload['jti'] ?? null;
            $issuedAt = $payload['iat'] ?? null;

            if (!$userId || !$oldJti || !$issuedAt) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid authentication token.',
                    'error' => 'TOKEN_INVALID',
                ], Response::HTTP_UNAUTHORIZED);
            }

            /*
        |--------------------------------------------------------------------------
        | Check refresh window
        |--------------------------------------------------------------------------
        */

            $refreshTtl = (int) config('jwt.refresh_ttl');

            if (now()->timestamp > ((int) $issuedAt + ($refreshTtl * 60))) {
                return response()->json([
                    'success' => false,
                    'message' => 'Refresh window expired. Please login again.',
                    'error' => 'REFRESH_WINDOW_EXPIRED',
                ], Response::HTTP_UNAUTHORIZED);
            }

            /*
        |--------------------------------------------------------------------------
        | Find user
        |--------------------------------------------------------------------------
        */

            $user = User::find($userId);

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User account not found.',
                    'error' => 'USER_NOT_FOUND',
                ], Response::HTTP_UNAUTHORIZED);
            }

            if (!$user->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'User account is inactive.',
                    'error' => 'ACCOUNT_INACTIVE',
                ], Response::HTTP_UNAUTHORIZED);
            }

            /*
        |--------------------------------------------------------------------------
        | Find current login session
        |--------------------------------------------------------------------------
        */

            $matchedSession = $user->loginSessions()
                ->where('jti', $oldJti)
                ->where('is_active', true)
                ->first();

            if (!$matchedSession) {
                return response()->json([
                    'success' => false,
                    'message' => 'Login session is no longer active. Please login again.',
                    'error' => 'SESSION_INVALID',
                ], Response::HTTP_UNAUTHORIZED);
            }

            /*
        |--------------------------------------------------------------------------
        | Refresh JWT
        |--------------------------------------------------------------------------
        */

            $newToken = JWTAuth::setToken($oldToken)->refresh();

            /*
        |--------------------------------------------------------------------------
        | Decode NEW token
        |--------------------------------------------------------------------------
        */

            $newPayload = JWTAuth::setToken($newToken)->getPayload();

            $newJti = $newPayload->get('jti');

            /*
        |--------------------------------------------------------------------------
        | Remember Me
        |--------------------------------------------------------------------------
        */

            $rememberMe = (bool) $matchedSession->remember;

            /*
        |--------------------------------------------------------------------------
        | Deactivate old session
        |--------------------------------------------------------------------------
        */

            $matchedSession->update([
                'is_active' => false,
                'logged_out_at' => now(),
            ]);

            /*
        |--------------------------------------------------------------------------
        | Create new session
        |--------------------------------------------------------------------------
        */

            $user->loginSessions()->create([
                'jti' => $newJti,
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'logged_in_at' => now(),
                'expires_at' => now()->addMinutes(config('jwt.ttl')),
                'is_active' => true,
                'provider' => 'refresh',
                'remember' => $rememberMe,
            ]);

            /*
        |--------------------------------------------------------------------------
        | Return new cookie
        |--------------------------------------------------------------------------
        */

            return response()->json([
                'success' => true,
                'message' => 'Token refreshed successfully.',
                'data' => [
                    // Additive for native clients - see the matching note in
                    // authenticatedResponse(). Web ignores this field.
                    'access_token' => $newToken,
                    'expiresIn' => config('jwt.ttl') * 60,
                    'rememberMe' => $rememberMe,
                ],
            ])->cookie(
                $this->authCookie($newToken, $rememberMe)
            );
        } catch (\Tymon\JWTAuth\Exceptions\TokenExpiredException $e) {

            return response()->json([
                'success' => false,
                'message' => 'Refresh window expired. Please login again.',
                'error' => 'REFRESH_WINDOW_EXPIRED',
            ], Response::HTTP_UNAUTHORIZED);
        } catch (\Tymon\JWTAuth\Exceptions\TokenInvalidException $e) {

            return response()->json([
                'success' => false,
                'message' => 'Invalid authentication token. Please login again.',
                'error' => 'TOKEN_INVALID',
            ], Response::HTTP_UNAUTHORIZED);
        } catch (JWTException $e) {

            Log::warning('JWT refresh failed.', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Unable to refresh session. Please login again.',
                'error' => 'REFRESH_FAILED',
            ], Response::HTTP_UNAUTHORIZED);
        }
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
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Login successful.',
            'data' => [
                'user' => new UserResource(
                    $user->load('role')
                ),
                // The web client never reads this - it relies solely on the
                // httpOnly cookie below. Included additively for native
                // clients (React Native), which cannot reliably read/persist
                // an httpOnly cookie and instead store this in secure storage
                // and send it as `Authorization: Bearer <token>` - a header
                // the `auth:api` JWT guard already accepts natively
                // (see AddJwtCookieToRequest, which only falls back to the
                // cookie when no Bearer header is already present).
                'access_token' => $token,
                'expires_in' => config('jwt.ttl') * 60,
                'provider' => $provider,
                'remember_me' => $rememberMe,
            ],
        ])->cookie(
            $this->authCookie(
                $token,
                $rememberMe
            )
        );
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
