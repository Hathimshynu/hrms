<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Designation\StoreDesignationRequest;
use App\Http\Requests\Designation\UpdateDesignationRequest;
use App\Models\Designation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class DesignationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Designation::with('department');

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            });
        }

        if ($request->filled('department_id')) {
            $query->where('department_id', $request->integer('department_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        return response()->json([
            'success' => true,
            'data' => $query->latest()->get(),
        ]);
    }

    public function store(StoreDesignationRequest $request): JsonResponse
    {
        $designation = Designation::create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Designation created successfully.',
            'data' => $designation->load('department'),
        ], Response::HTTP_CREATED);
    }

    public function show(Designation $designation): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $designation->load('department'),
        ]);
    }

    public function update(UpdateDesignationRequest $request, Designation $designation): JsonResponse
    {
        $designation->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Designation updated successfully.',
            'data' => $designation->fresh()->load('department'),
        ]);
    }

    public function destroy(Designation $designation): JsonResponse
    {
        if ($designation->employees()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete this designation because employees are assigned to it.',
            ], Response::HTTP_CONFLICT);
        }

        $designation->delete();

        return response()->json([
            'success' => true,
            'message' => 'Designation deleted successfully.',
        ]);
    }
}
