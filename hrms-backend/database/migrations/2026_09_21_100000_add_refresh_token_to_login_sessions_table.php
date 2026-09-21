<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('login_sessions', function (Blueprint $table) {
            // SHA-256 of an opaque refresh token; the plaintext is never stored.
            $table->char('refresh_token_hash', 64)->nullable()->unique()->after('jti');
            $table->timestamp('refresh_expires_at')->nullable()->after('expires_at');
            $table->timestamp('rotated_at')->nullable()->after('refresh_expires_at');
        });
    }

    public function down(): void
    {
        Schema::table('login_sessions', function (Blueprint $table) {
            $table->dropUnique(['refresh_token_hash']);
            $table->dropColumn(['refresh_token_hash', 'refresh_expires_at', 'rotated_at']);
        });
    }
};
