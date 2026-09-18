<?php

use Illuminate\Support\Facades\Route;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

Route::get('/', function () {
    return response()->json([
        'success' => true,
        'message' => 'HRMS backend API running',
    ]);
});

Route::get('/update-password', function () {

    $user = User::where('id', 2)->update([
        'password' => Hash::make('Password@123'),
    ]);
    if($user) {
        return response()->json([
            'success' => true,
            'message' => 'Password updated successfully',
        ]);
    }

    return response()->json([
        'success' => false,
        'message' => 'Failed to update password',
    ]);
});
