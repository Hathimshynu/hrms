<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Holiday\HolidayListRequest;
use App\Http\Requests\Holiday\StoreHolidayRequest;
use App\Http\Requests\Holiday\UpdateHolidayRequest;
use App\Models\Holiday;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Global holiday calendar. Management routes need the `* holidays`
 * permissions; upcoming() is the read-only employee view behind `view leaves`.
 * Holidays are date-only (Y-m-d) and never converted between time zones.
 * Only ACTIVE holidays affect leave-day counting and the absence calculation.
 */
class HolidayController extends Controller
{
    /** Widest window a list request may return (holidays are a few dozen per year). */
    private const MAX_RANGE_DAYS = 731;

    public function index(HolidayListRequest $request): JsonResponse
    {
        if ($request->filled('from_date') && $request->filled('to_date')
            && Carbon::parse($request->string('from_date')->toString())->diffInDays(Carbon::parse($request->string('to_date')->toString())) >= self::MAX_RANGE_DAYS) {
            return response()->json([
                'success' => false,
                'message' => 'The date range cannot exceed '.self::MAX_RANGE_DAYS.' days.',
                'errors' => ['to_date' => ['The date range cannot exceed '.self::MAX_RANGE_DAYS.' days.']],
            ], 422);
        }

        $query = Holiday::query();

        if ($request->filled('from_date') || $request->filled('to_date')) {
            if ($request->filled('from_date')) {
                $query->where('holiday_date', '>=', $request->string('from_date')->toString());
            }
            if ($request->filled('to_date')) {
                $query->where('holiday_date', '<=', $request->string('to_date')->toString());
            }
        } else {
            $year = $request->filled('year') ? $request->integer('year') : (int) now()->format('Y');
            $query->whereBetween('holiday_date', [$year.'-01-01', $year.'-12-31']);
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($request->filled('search')) {
            $term = '%'.addcslashes($request->string('search')->toString(), '%_\\').'%';
            $query->where(fn ($q) => $q->where('name', 'like', $term)->orWhere('description', 'like', $term));
        }

        return response()->json(['success' => true, 'data' => $query->orderBy('holiday_date')->get()]);
    }

    /** Active holidays from today, for every signed-in employee (`view leaves`). */
    public function upcoming(Request $request): JsonResponse
    {
        $today = now()->startOfDay();

        $holidays = Holiday::query()
            ->where('is_active', true)
            ->where('holiday_date', '>=', $today->toDateString())
            ->orderBy('holiday_date')
            ->limit(10)
            ->get(['id', 'name', 'holiday_date', 'description'])
            ->map(fn (Holiday $h) => [
                'id' => $h->id,
                'name' => $h->name,
                'holiday_date' => $h->holiday_date->format('Y-m-d'),
                'description' => $h->description,
                'days_until' => (int) $today->diffInDays($h->holiday_date->copy()->startOfDay()),
            ]);

        return response()->json(['success' => true, 'data' => $holidays]);
    }

    public function show(Holiday $holiday): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $holiday]);
    }

    public function store(StoreHolidayRequest $request): JsonResponse
    {
        $holiday = Holiday::create([
            'name' => trim($request->string('name')->toString()),
            'holiday_date' => $request->string('holiday_date')->toString(),
            'description' => $request->filled('description') ? trim($request->string('description')->toString()) : null,
            'is_active' => $request->has('is_active') ? $request->boolean('is_active') : true,
        ]);

        Log::info('holiday.created', ['id' => $holiday->id, 'by' => $request->user('api')->id]);

        return response()->json(['success' => true, 'message' => 'Holiday created successfully.', 'data' => $holiday->fresh()], 201);
    }

    public function update(UpdateHolidayRequest $request, Holiday $holiday): JsonResponse
    {
        $data = [];

        if ($request->has('name')) {
            $data['name'] = trim($request->string('name')->toString());
        }
        if ($request->has('holiday_date')) {
            $data['holiday_date'] = $request->string('holiday_date')->toString();
        }
        if ($request->has('description')) {
            $data['description'] = $request->filled('description') ? trim($request->string('description')->toString()) : null;
        }
        if ($request->has('is_active')) {
            $data['is_active'] = $request->boolean('is_active');
        }

        $holiday->update($data);

        Log::info('holiday.updated', ['id' => $holiday->id, 'by' => $request->user('api')->id]);

        return response()->json(['success' => true, 'message' => 'Holiday updated successfully.', 'data' => $holiday->fresh()]);
    }

    public function destroy(Request $request, Holiday $holiday): JsonResponse
    {
        $holiday->delete();

        Log::info('holiday.deleted', ['id' => $holiday->id, 'by' => $request->user('api')->id]);

        return response()->json(['success' => true, 'message' => 'Holiday deleted successfully.']);
    }
}
