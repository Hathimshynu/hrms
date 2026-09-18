<?php

namespace App\Models;

use App\Models\Concerns\FormatsModelDates;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Role extends Model
{
    use FormatsModelDates, HasFactory;

    protected $fillable = [
        'name',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(
            Permission::class,
            'role_has_permissions',
            'role_id', 'permission_id'
        );
    }

    public function givePermissionTo(Permission $permission): void
    {
        $this->permissions()
            ->syncWithoutDetaching([$permission->id]);
    }

    public function syncPermissions(array $permissionNames): void
    {
        $permissionIds = Permission::whereIn(
            'name',
            $permissionNames
        )->pluck('id');

        $this->permissions()->sync($permissionIds);
    }
}