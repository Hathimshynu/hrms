<?php

namespace App\Models;

use App\Models\Concerns\FormatsModelDates;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoginSession extends Model
{
    use FormatsModelDates, HasFactory;

    protected $fillable = [
        'user_id',
        'jti',
        'ip_address',
        'user_agent',
        'logged_in_at',
        'logged_out_at',
        'expires_at',
        'is_active',
        'provider',
        'remember',
    ];

    protected function casts(): array
    {
        return [
            'logged_in_at' => 'datetime',
            'logged_out_at' => 'datetime',
            'expires_at' => 'datetime',
            'is_active' => 'boolean',
            'remember' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}