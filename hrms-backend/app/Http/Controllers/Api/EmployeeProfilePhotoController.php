<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;

class EmployeeProfilePhotoController extends Controller
{
    public function show(Employee $employee)
    {
        if (!$employee->profile_photo) {
            return response()->json([
                'success' => false,
                'message' => 'Profile photo not found for this employee.',
            ], Response::HTTP_NOT_FOUND);
        }

        $disk = Storage::disk('private');

        if (!$disk->exists($employee->profile_photo)) {
            return response()->json([
                'success' => false,
                'message' => 'Profile photo file not found in storage.',
            ], Response::HTTP_NOT_FOUND);
        }

        return response($disk->get($employee->profile_photo), Response::HTTP_OK)
            ->header('Content-Type', $disk->mimeType($employee->profile_photo))
            ->header('Content-Disposition', 'inline')
            ->header('Cache-Control', 'private, no-store, max-age=0')
            ->header('X-Content-Type-Options', 'nosniff');
    }
}
