<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SaveEmployeeDraftRequest;
use App\Models\EmployeeOnboardingDraft;
use App\Services\EmployeeOnboardingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;
use App\Http\Requests\CompleteEmployeeRequest;

class EmployeeDraftController extends Controller
{
    public function __construct(protected EmployeeOnboardingService $onboardingService) {}

    /**
     * List active drafts for current user.
     */
    public function index(Request $request): JsonResponse
    {
        $drafts = EmployeeOnboardingDraft::with('employee')
            ->where('created_by', $request->user()->id)
            ->where('status', 'draft')
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $drafts,
        ]);
    }

    /**
     * Start a new employee onboarding draft.
     */
    public function store(Request $request): JsonResponse
    {
        $draft = $this->onboardingService->start($request->user());

        return response()->json([
            'success' => true,
            'message' => 'Employee onboarding draft started.',
            'data' => [
                'draft' => [
                    'id' => $draft->id,
                    'employee_id' => $draft->employee_id,
                    'current_step' => $draft->current_step,
                    'completed_steps' => $draft->completed_steps,
                    'status' => $draft->status,
                    'last_saved_at' => $this->formatDate($draft->last_saved_at),
                ],
                'employee' => null,
            ],
        ], Response::HTTP_CREATED);
    }

    /**
     * Get a specific draft.
     */
    public function show(Request $request, EmployeeOnboardingDraft $employeeDraft): JsonResponse
    {
        if (!$this->isOwner($request, $employeeDraft)) {
            return response()->json(['success' => false, 'message' => 'Draft not found.'], Response::HTTP_NOT_FOUND);
        }

        if (!$employeeDraft->isActive()) {
            return response()->json(['success' => false, 'message' => 'This draft is no longer active.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $employeeDraft->load([
            'employee.department',
            'employee.designation',
            'employee.branch',
            'employee.location',
            'employee.reportingManager',
            'employee.user.role',
            'employee.addresses',
            'employee.bankDetails',
            'employee.compensations',
            'employee.documents',
            'employee.education',
            'employee.experiences',
            'employee.emergencyContacts',
            'employee.leaveAttendance.leavePolicy',
            'employee.leaveAttendance.attendancePolicy',
            'employee.leaveAttendance.workSchedule',
            'employee.leaveAttendance.shift',
            'employee.leaveAttendance.weeklyOff',
            'employee.leaveAttendance.latePolicy',
            'employee.leaveAttendance.overtimePolicy',
            'employee.onboarding.checklist',
            'employee.onboarding.assignedBuddy',
            'employee.onboarding.equipment',
        ]);

        return response()->json([
            'success' => true,
            'data' => $this->formatFullDraft($employeeDraft),
        ]);
    }

    /**
     * Save any onboarding step.
     */
    public function updateStep(SaveEmployeeDraftRequest $request, int $step): JsonResponse
    {
        if ($step < 1 || $step > 11) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid step number. Must be between 1 and 11.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $employeeDraft = EmployeeOnboardingDraft::where('id', $request->draft_id)
            ->where('created_by', $request->user()->id)
            ->first();

        if (!$employeeDraft) {
            return response()->json([
                'success' => false,
                'message' => 'Draft not found.',
            ], Response::HTTP_NOT_FOUND);
        }

        if (!$employeeDraft->isActive()) {
            return response()->json([
                'success' => false,
                'message' => 'This draft is no longer active.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        try {
            $result = $this->onboardingService->saveStep($employeeDraft, $step, $request->validated());

            return response()->json([
                'success' => true,
                'message' => "Step {$step} saved successfully.",
                'data' => [
                    'draft' => [
                        'id' => $result['draft']->id,
                        'employee_id' => $result['draft']->employee_id,
                        'current_step' => $result['draft']->current_step,
                        'completed_steps' => $result['draft']->completed_steps,
                        'next_step' => $result['next_step'],
                        'status' => $result['draft']->status,
                        'last_saved_at' => $this->formatDate($result['draft']->last_saved_at),
                    ],
                    'employee' => $result['employee'] ? [
                        'id' => $result['employee']->id,
                        'employee_code' => $result['employee']->employee_code,
                        'name' => trim($result['employee']->first_name . ' ' . $result['employee']->last_name),
                        'email' => $result['employee']->email,
                        'employment_status' => $result['employee']->employment_status,
                        'lifecycle' => $result['employee']->lifecycle,
                    ] : null,
                ],
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }
    }

    /**
     * Complete onboarding.
     */
    public function complete(CompleteEmployeeRequest $request): JsonResponse
    {
        $employeeDraft = EmployeeOnboardingDraft::where('id', $request->validated('draft_id'))
            ->where('created_by', $request->user()->id)
            ->first();

        if (!$employeeDraft) {
            return response()->json([
                'success' => false,
                'message' => 'Draft not found.',
            ], Response::HTTP_NOT_FOUND);
        }

        if (!$employeeDraft->isActive()) {
            return response()->json([
                'success' => false,
                'message' => 'This draft is no longer active.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        try {
            $result = $this->onboardingService->complete($employeeDraft);
            $employee = $result['employee'];

            return response()->json([
                'success' => true,
                'message' => 'Employee onboarding completed successfully. Login credentials have been sent to the employee\'s email.',
                'data' => [
                    'employee' => [
                        'id' => $employee->id,
                        'employee_code' => $employee->employee_code,
                        'name' => trim($employee->first_name . ' ' . $employee->last_name),
                        'email' => $employee->email,
                        'department' => $employee->department?->name,
                        'designation' => $employee->designation?->name,
                        'status' => $employee->employment_status,
                        'lifecycle' => $employee->lifecycle,
                    ],
                    'account' => [
                        'user_id' => $result['user']->id,
                        'email' => $result['user']->email,
                        'role_id' => $result['user']->role_id,
                        'must_change_password' => $result['user']->must_change_password,
                    ],
                    'onboarding' => [
                        'status' => $result['onboarding']->onboarding_status,
                    ],
                    'email' => [
                        'sent' => $result['email_sent'] ?? false,
                    ],
                ],
            ], Response::HTTP_CREATED);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'message' => 'Failed to complete employee onboarding.',
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Cancel/delete a draft.
     */
    public function destroy(Request $request, EmployeeOnboardingDraft $employeeDraft): JsonResponse
    {
        if (!$this->isOwner($request, $employeeDraft)) {
            return response()->json([
                'success' => false,
                'message' => 'Draft not found.',
            ], Response::HTTP_NOT_FOUND);
        }

        if (!$employeeDraft->isActive()) {
            return response()->json([
                'success' => false,
                'message' => 'This draft is no longer active.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $employeeDraft->update([
            'status' => 'cancelled',
            'updated_by' => $request->user()->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Employee onboarding draft cancelled successfully.',
        ]);
    }

    protected function isOwner(Request $request, EmployeeOnboardingDraft $draft): bool
    {
        return (int) $draft->created_by === (int) $request->user()->id;
    }

    protected function formatDraft(EmployeeOnboardingDraft $draft): array
    {
        return [
            'id' => $draft->id,
            'employee_id' => $draft->employee_id,
            'current_step' => $draft->current_step,
            'completed_steps' => $draft->completed_steps ?? [],
            'next_step' => $this->getNextStep($draft->completed_steps ?? []),
            'form_data' => $draft->form_data ?? [],
            'status' => $draft->status,
            'last_saved_at' => $this->formatDate($draft->last_saved_at),
            'employee' => $draft->employee ? [
                'id' => $draft->employee->id,
                'employee_code' => $draft->employee->employee_code,
                'name' => trim($draft->employee->first_name . ' ' . $draft->employee->last_name),
                'email' => $draft->employee->email,
            ] : null,
        ];
    }

    protected function formatFullDraft(EmployeeOnboardingDraft $draft): array
    {
        $employee = $draft->employee;
        $onboarding = $employee?->onboarding;

        return [
            'draft' => [
                'id' => $draft->id,
                'employee_id' => $draft->employee_id,
                'current_step' => $draft->current_step,
                'completed_steps' => $draft->completed_steps ?? [],
                'next_step' => $this->getNextStep($draft->completed_steps ?? []),
                'status' => $draft->status,
                'last_saved_at' => $this->formatDate($draft->last_saved_at),
            ],

            'employee' => $employee ? [
                'id' => $employee->id,
                'employee_code' => $employee->employee_code,
                'first_name' => $employee->first_name,
                'last_name' => $employee->last_name,
                'email' => $employee->email,
                'phone' => $employee->phone,
                'alternate_phone' => $employee->alternate_phone,
                'date_of_birth' => $employee->date_of_birth,
                'gender' => $employee->gender,
                'marital_status' => $employee->marital_status,
                'profile_photo' => $employee->profile_photo,
                'employment_status' => $employee->employment_status,
                'lifecycle' => $employee->lifecycle,
            ] : null,

            'employment' => $employee ? [
                'employment_type' => $employee->employment_type,
                'probation_end_date' => $employee->probation_end_date,
                'joining_date' => $employee->joining_date,

                'department_id' => $employee->department_id,
                'department' => $employee->department ? [
                    'id' => $employee->department->id,
                    'name' => $employee->department->name,
                    'code' => $employee->department->code,
                ] : null,

                'designation_id' => $employee->designation_id,
                'designation' => $employee->designation ? [
                    'id' => $employee->designation->id,
                    'name' => $employee->designation->name,
                    'code' => $employee->designation->code,
                ] : null,

                'branch_id' => $employee->branch_id,
                'branch' => $employee->branch ? [
                    'id' => $employee->branch->id,
                    'name' => $employee->branch->name,
                    'code' => $employee->branch->code,
                ] : null,

                'location_id' => $employee->location_id,
                'location' => $employee->location ? [
                    'id' => $employee->location->id,
                    'name' => $employee->location->name,
                    'code' => $employee->location->code,
                ] : null,

                'reporting_manager_id' => $employee->reporting_manager_id,
                'reporting_manager' => $employee->reportingManager ? [
                    'id' => $employee->reportingManager->id,
                    'employee_code' => $employee->reportingManager->employee_code,
                    'name' => trim($employee->reportingManager->first_name . ' ' . $employee->reportingManager->last_name),
                ] : null,

                'employment_level' => $employee->employment_level,
                'work_mode' => $employee->work_mode,

                'shift_id' => $employee->shift_id,
                'work_schedule_id' => $employee->work_schedule_id,
            ] : null,

            'account' => $employee?->user ? [
                'user_id' => $employee->user->id,
                'email' => $employee->user->email,
                'username' => $employee->user->username,
                'role_id' => $employee->user->role_id,
                'access_level' => $employee->user->access_level,
                'role' => $employee->user->role ? [
                    'id' => $employee->user->role->id,
                    'name' => $employee->user->role->name,
                ] : null,
                'is_active' => $employee->user->is_active,
                'must_change_password' => $employee->user->must_change_password,
            ] : null,

            'address' => $employee?->addresses ?? [],

            'emergency_contact' => $employee?->emergencyContacts ?? [],

            'compensation' => $employee?->compensations ?? [],

            'bank_details' => $employee?->bankDetails?->map(function ($bank) {
                return [
                    'id' => $bank->id,
                    'bank_name' => $bank->bank_name,
                    'account_holder_name' => $bank->account_holder_name,
                    'account_number' => $bank->account_number,
                    'ifsc_code' => $bank->ifsc_code,
                    'account_type' => $bank->account_type,
                    'pan' => $bank->pan,
                    'uan' => $bank->uan,
                    'pf_number' => $bank->pf_number,
                ];
            })->values() ?? [],

            'documents' => $employee?->documents?->map(function ($document) {
                return [
                    'id' => $document->id,
                    'document_type' => $document->document_type,
                    'status' => $document->status,
                    'file_path' => $document->file_path,
                    'file_name' => $document->file_name,
                    'mime_type' => $document->mime_type,
                    'file_size' => $document->file_size,
                ];
            })->values() ?? [],

            'education' => $employee?->education ?? [],
            'experience' => $employee?->experiences ?? [],

            'leave_attendance' => $employee?->leaveAttendance ? [
                'id' => $employee->leaveAttendance->id,
                'leave_policy_id' => $employee->leaveAttendance->leave_policy_id,
                'leave_policy' => $employee->leaveAttendance->leavePolicy ? [
                    'id' => $employee->leaveAttendance->leavePolicy->id,
                    'name' => $employee->leaveAttendance->leavePolicy->name,
                    'code' => $employee->leaveAttendance->leavePolicy->code,
                ] : null,
                'attendance_policy_id' => $employee->leaveAttendance->attendance_policy_id,
                'attendance_policy' => $employee->leaveAttendance->attendancePolicy ? [
                    'id' => $employee->leaveAttendance->attendancePolicy->id,
                    'name' => $employee->leaveAttendance->attendancePolicy->name,
                    'code' => $employee->leaveAttendance->attendancePolicy->code,
                ] : null,
                'work_schedule_id' => $employee->leaveAttendance->work_schedule_id,
                'work_schedule' => $employee->leaveAttendance->workSchedule ? [
                    'id' => $employee->leaveAttendance->workSchedule->id,
                    'name' => $employee->leaveAttendance->workSchedule->name,
                    'code' => $employee->leaveAttendance->workSchedule->code,
                ] : null,
                'shift_id' => $employee->leaveAttendance->shift_id,
                'shift' => $employee->leaveAttendance->shift ? [
                    'id' => $employee->leaveAttendance->shift->id,
                    'name' => $employee->leaveAttendance->shift->name,
                    'code' => $employee->leaveAttendance->shift->code,
                ] : null,
                'weekly_off_id' => $employee->leaveAttendance->weekly_off_id,
                'weekly_off' => $employee->leaveAttendance->weeklyOff ? [
                    'id' => $employee->leaveAttendance->weeklyOff->id,
                    'name' => $employee->leaveAttendance->weeklyOff->name,
                    'code' => $employee->leaveAttendance->weeklyOff->code,
                    'days' => $employee->leaveAttendance->weeklyOff->days,
                ] : null,
                'late_policy_id' => $employee->leaveAttendance->late_policy_id,
                'late_policy' => $employee->leaveAttendance->latePolicy ? [
                    'id' => $employee->leaveAttendance->latePolicy->id,
                    'name' => $employee->leaveAttendance->latePolicy->name,
                    'code' => $employee->leaveAttendance->latePolicy->code,
                ] : null,
                'overtime_policy_id' => $employee->leaveAttendance->overtime_policy_id,
                'overtime_policy' => $employee->leaveAttendance->overtimePolicy ? [
                    'id' => $employee->leaveAttendance->overtimePolicy->id,
                    'name' => $employee->leaveAttendance->overtimePolicy->name,
                    'code' => $employee->leaveAttendance->overtimePolicy->code,
                ] : null,
            ] : null,

            'onboarding' => $onboarding ? [
                'id' => $onboarding->id,
                'onboarding_status' => $onboarding->onboarding_status,
                'start_date' => $onboarding->start_date,
                'checklist_id' => $onboarding->checklist_id,
                'checklist' => $onboarding->checklist ? [
                    'id' => $onboarding->checklist->id,
                    'name' => $onboarding->checklist->name,
                    'code' => $onboarding->checklist->code,
                ] : null,
                'assigned_buddy_id' => $onboarding->assigned_buddy_id,
                'assigned_buddy' => $onboarding->assignedBuddy ? [
                    'id' => $onboarding->assignedBuddy->id,
                    'name' => $onboarding->assignedBuddy->name,
                    'email' => $onboarding->assignedBuddy->email,
                ] : null,
                'hr_notes' => $onboarding->hr_notes,
                'equipment' => $onboarding->equipment->map(function ($equipment) {
                    return [
                        'id' => $equipment->id,
                        'name' => $equipment->name,
                        'code' => $equipment->code,
                        'category' => $equipment->category,
                        'status' => $equipment->pivot->status,
                        'assigned_at' => $equipment->pivot->assigned_at,
                        'returned_at' => $equipment->pivot->returned_at,
                        'notes' => $equipment->pivot->notes,
                    ];
                })->values(),
            ] : null,
        ];
    }

    protected function getNextStep(array $completedSteps): ?int
    {
        for ($step = 1; $step <= 11; $step++) {
            if (!in_array($step, $completedSteps, true)) {
                return $step;
            }
        }

        return null;
    }

    protected function formatDate($date): ?string
    {
        return $date ? $date->timezone(config('app.timezone'))->format('Y-m-d H:i:s') : null;
    }
}
