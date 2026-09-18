<?php

namespace App\Models;

use App\Models\Concerns\FormatsModelDates;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use FormatsModelDates, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
        'role_id',
        'access_level',
        'token_version',
        'is_active',
        'last_login_ip',
        'last_login_at',
        'must_change_password',
        'google_id',
        'google_avatar',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
            'token_version' => 'integer',
            'is_active' => 'boolean',
            'must_change_password' => 'boolean',
        ];
    }

    public function employee(): HasOne
    {
        return $this->hasOne(Employee::class);
    }

    public function departments(): HasMany
    {
        return $this->hasMany(
            Department::class,
            'head_id'
        );
    }

    public function loginSessions(): HasMany
    {
        return $this->hasMany(LoginSession::class);
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function uploadedDocuments(): HasMany
    {
        return $this->hasMany(
            EmployeeDocument::class,
            'uploaded_by'
        );
    }

    public function approvedLeaves(): HasMany
    {
        return $this->hasMany(
            LeaveRequest::class,
            'approved_by'
        );
    }

    public function onboardingDrafts(): HasMany
    {
        return $this->hasMany(
            EmployeeOnboardingDraft::class,
            'created_by'
        );
    }

    public function updatedOnboardingDrafts(): HasMany
    {
        return $this->hasMany(
            EmployeeOnboardingDraft::class,
            'updated_by'
        );
    }

    public function assignedOnboarding(): HasMany
    {
        return $this->hasMany(
            EmployeeOnboarding::class,
            'assigned_buddy_id'
        );
    }

    public function hasRole(string $roleName): bool
    {
        return $this->role?->name === $roleName;
    }

    public function assignRole(string $roleName): self
    {
        $role = Role::where('name', $roleName)->firstOrFail();

        $this->role()->associate($role);
        $this->save();

        return $this;
    }

    public function can($abilities, $arguments = []): bool
    {
        $permissions = is_array($abilities)
            ? $abilities
            : [$abilities];

        foreach ($permissions as $permissionName) {
            if (! $this->role?->permissions()
                ->where('name', $permissionName)
                ->exists()) {
                return false;
            }
        }

        return true;
    }

    public function getPermissionNames()
    {
        return $this->role?->permissions()->pluck('name')
            ?? collect();
    }

    public function getJWTIdentifier(): mixed
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims(): array
    {
        return [
            'token_version' => (int) $this->token_version,
        ];
    }
}