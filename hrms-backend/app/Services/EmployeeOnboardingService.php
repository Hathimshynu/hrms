<?php

namespace App\Services;

use App\Mail\EmployeeWelcomeMail;
use App\Models\Designation;
use App\Models\Employee;
use App\Models\EmployeeAddress;
use App\Models\EmployeeBankDetail;
use App\Models\EmployeeCompensation;
use App\Models\EmployeeDocument;
use App\Models\EmployeeEducation;
use App\Models\EmployeeEmergencyContact;
use App\Models\EmployeeExperience;
use App\Models\EmployeeLeaveAttendance;
use App\Models\EmployeeOnboarding;
use App\Models\EmployeeOnboardingDraft;
use App\Models\Location;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;

class EmployeeOnboardingService
{
    public function __construct(protected EmployeeCodeService $codeService) {}

    /*
    |--------------------------------------------------------------------------
    | START ONBOARDING
    |--------------------------------------------------------------------------
    */

    public function start(User $user): EmployeeOnboardingDraft
    {
        $draft = EmployeeOnboardingDraft::where('created_by', $user->id)->where('status', 'draft')->latest('id')->first();

        if ($draft) {
            return $draft;
        }
        return EmployeeOnboardingDraft::create([
            'employee_id' => null,
            'created_by' => $user->id,
            'updated_by' => $user->id,
            'current_step' => 1,
            'completed_steps' => [],
            'form_data' => [],
            'status' => 'draft',
            'created_by' => $user->id,
            'updated_by' => $user->id,
            'last_saved_at' => now(),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | SAVE STEP
    |--------------------------------------------------------------------------
    */

    public function saveStep(EmployeeOnboardingDraft $draft, int $step, array $data): array
    {
        $this->ensureDraftIsActive($draft);

        return match ($step) {
            1 => $this->savePersonal($draft, $data),
            2 => $this->saveEmployment($draft, $data),
            3 => $this->saveWorkContactAccount($draft, $data),
            4 => $this->saveAddress($draft, $data),
            5 => $this->saveEmergencyContact($draft, $data),
            6 => $this->saveCompensation($draft, $data),
            7 => $this->saveBankDetails($draft, $data),
            8 => $this->saveDocuments($draft, $data),
            9 => $this->saveProfessionalInfo($draft, $data),
            10 => $this->saveLeaveAttendance($draft, $data),
            11 => $this->saveOnboarding($draft, $data),
            default => throw ValidationException::withMessages([
                'step' => ['Invalid step number. Must be between 1 and 11.'],
            ]),
        };
    }

    /*
    |--------------------------------------------------------------------------
    | STEP 1 - PERSONAL INFORMATION
    |--------------------------------------------------------------------------
    |
    | Employee is created here.
    | Employee code is generated here.
    |
    */

    protected function savePersonal(EmployeeOnboardingDraft $draft, array $data): array
    {
        return DB::transaction(function () use ($draft, $data) {
            if ($draft->employee_id) {
                $employee = $draft->employee;

                if (!$employee) {
                    throw ValidationException::withMessages([
                        'employee' => ['Employee record could not be found.'],
                    ]);
                }

                $employee->update([
                    'first_name' => $data['first_name'],
                    'last_name' => $data['last_name'],
                    'email' => $data['email'],
                    'phone' => $data['phone'],
                    'alternate_phone' => $data['alternate_phone'] ?? null,
                    'date_of_birth' => $data['date_of_birth'],
                    'gender' => $data['gender'],
                    'marital_status' => $data['marital_status'],
                ]);
            } else {
                $employee = new Employee();

                $employee->employee_code = $this->codeService->generate();
                $employee->first_name = $data['first_name'];
                $employee->last_name = $data['last_name'];
                $employee->email = $data['email'];
                $employee->phone = $data['phone'];
                $employee->alternate_phone = $data['alternate_phone'] ?? null;
                $employee->date_of_birth = $data['date_of_birth'];
                $employee->gender = $data['gender'];
                $employee->marital_status = $data['marital_status'];
                $employee->employment_status = 'Onboarding';
                $employee->lifecycle = 'Hired';
                $employee->save();

                $draft->update([
                    'employee_id' => $employee->id,
                ]);
            }

            if (!empty($data['profile_photo'])) {
                $path = $this->saveBase64ProfilePhoto($data['profile_photo'], $employee->id);

                $employee->update([
                    'profile_photo' => $path,
                ]);
            }

            $this->markStepCompleted($draft, 1, $data);

            $draft = $draft->fresh();
            $employee = $employee->fresh();

            return [
                'draft' => $draft,
                'employee' => $employee,
                'next_step' => $this->getNextStep($draft->completed_steps ?? []),
            ];
        });
    }

    /*
    |--------------------------------------------------------------------------
    | STEP 2 - EMPLOYMENT INFORMATION
    |--------------------------------------------------------------------------
    */

    protected function saveEmployment(EmployeeOnboardingDraft $draft, array $data): array
    {
        return DB::transaction(function () use ($draft, $data) {
            $employee = $this->getEmployee($draft);

            $designationExists = Designation::where('id', $data['designation_id'])
                ->where('department_id', $data['department_id'])
                ->exists();

            if (!$designationExists) {
                throw ValidationException::withMessages([
                    'designation_id' => ['The selected designation does not belong to the selected department.'],
                ]);
            }

            if (!empty($data['reporting_manager_id'])) {
                $managerExists = Employee::where('id', $data['reporting_manager_id'])
                    ->where('employment_status', 'Active')
                    ->exists();

                if (!$managerExists) {
                    throw ValidationException::withMessages([
                        'reporting_manager_id' => ['The selected reporting manager is not an active employee.'],
                    ]);
                }

                if ((int) $data['reporting_manager_id'] === (int) $employee->id) {
                    throw ValidationException::withMessages([
                        'reporting_manager_id' => ['An employee cannot be their own reporting manager.'],
                    ]);
                }
            }

            if (!empty($data['location_id'])) {
                $locationExists = Location::where('id', $data['location_id'])
                    ->where('is_active', true)
                    ->when(!empty($data['branch_id']), function ($query) use ($data) {
                        $query->where('branch_id', $data['branch_id']);
                    })
                    ->exists();

                if (!$locationExists) {
                    throw ValidationException::withMessages([
                        'location_id' => ['The selected location does not belong to the selected branch.'],
                    ]);
                }
            }

            $employee->update([
                'employment_type' => $data['employment_type'],
                'probation_end_date' => $data['probation_end_date'] ?? null,
                'joining_date' => $data['joining_date'],
                'department_id' => $data['department_id'],
                'designation_id' => $data['designation_id'],
                'branch_id' => $data['branch_id'] ?? null,
                'location_id' => $data['location_id'] ?? null,
                'reporting_manager_id' => $data['reporting_manager_id'] ?? null,
                'employment_level' => $data['employment_level'] ?? null,
                'work_mode' => $data['work_mode'] ?? null,
                'shift_id' => $data['shift_id'] ?? null,
                'work_schedule_id' => $data['work_schedule_id'] ?? null,
            ]);

            $this->markStepCompleted($draft, 2, $data);

            $draft = $draft->fresh();
            $employee = $employee->fresh();

            return [
                'draft' => $draft,
                'employee' => $employee,
                'next_step' => $this->getNextStep($draft->completed_steps ?? []),
            ];
        });
    }

    /*
    |--------------------------------------------------------------------------
    | STEP 3 - WORK CONTACT & ACCOUNT
    |--------------------------------------------------------------------------
    */

    protected function saveWorkContactAccount(EmployeeOnboardingDraft $draft, array $data): array
    {
        $employee = $this->getEmployee($draft);

        return DB::transaction(function () use ($draft, $employee, $data) {
            $employee->update([
                'work_email' => strtolower($data['work_email']),
                'work_phone' => $data['work_phone'] ?? null,
            ]);

            $user = $employee->user;

            $assignedRole = Role::findOrFail($data['role_id']);
            $actor = auth('api')->user();

            if ($actor && ! $actor->canAssignRole($assignedRole)) {
                throw new HttpResponseException(response()->json([
                    'success' => false,
                    'message' => 'You are not allowed to assign this role.',
                ], 403));
            }

            if (!$user) {
                // The real temporary password is generated and emailed only at
                // completion (see complete()); until then the account holds an
                // unusable random hash, so no plaintext is ever stored.
                $user = User::create([
                    'name' => trim($employee->first_name . ' ' . $employee->last_name),
                    'username' => $employee->employee_code,
                    'email' => strtolower($data['work_email']),
                    'password' => Hash::make(Str::random(64)),
                    'role_id' => $data['role_id'],
                    'access_level' => $data['access_level'],
                    'is_active' => true,
                    'must_change_password' => true,
                    'token_version' => 1,
                ]);

                $employee->update([
                    'user_id' => $user->id,
                ]);
            } else {
                $user->update([
                    'email' => strtolower($data['work_email']),
                    'role_id' => $data['role_id'],
                    'access_level' => $data['access_level'],
                ]);
            }

            $onboarding = $employee->onboarding()->firstOrCreate(
                ['employee_id' => $employee->id],
                ['onboarding_status' => 'pending']
            );

            $this->markStepCompleted($draft, 3, [
                'work_email' => strtolower($data['work_email']),
                'work_phone' => $data['work_phone'] ?? null,
                'role_id' => $data['role_id'],
                'access_level' => $data['access_level'],
            ]);

            return [
                'draft' => $draft->fresh(),
                'employee' => $employee->fresh(),
                'user' => $user->fresh(),
                'next_step' => $this->getNextStep($draft->completed_steps ?? []),
            ];
        });
    }

    /*
    |--------------------------------------------------------------------------
    | STEP 4 - ADDRESS
    |--------------------------------------------------------------------------
    */

    protected function saveAddress(EmployeeOnboardingDraft $draft, array $data): array
    {
        return DB::transaction(function () use ($draft, $data) {
            $employee = $this->getEmployee($draft);

            $current = $data['current_address'];

            $permanent = $data['same_as_current']
                ? $current
                : $data['permanent_address'];

            $employee->addresses()->updateOrCreate(
                ['type' => 'current'],
                [
                    'address_line_1' => $current['address_line_1'],
                    'address_line_2' => $current['address_line_2'] ?? null,
                    'city' => $current['city'],
                    'state' => $current['state'],
                    'country' => $current['country'],
                    'postal_code' => $current['postal_code'],
                ]
            );

            $employee->addresses()->updateOrCreate(
                ['type' => 'permanent'],
                [
                    'address_line_1' => $permanent['address_line_1'],
                    'address_line_2' => $permanent['address_line_2'] ?? null,
                    'city' => $permanent['city'],
                    'state' => $permanent['state'],
                    'country' => $permanent['country'],
                    'postal_code' => $permanent['postal_code'],
                ]
            );

            $employee->update([
                'address' => implode(', ', array_filter([
                    $permanent['address_line_1'],
                    $permanent['address_line_2'] ?? null,
                    $permanent['city'],
                    $permanent['state'],
                    $permanent['country'],
                    $permanent['postal_code'],
                ])),
            ]);

            $this->markStepCompleted($draft, 4, $data);

            $draft = $draft->fresh();
            $employee = $employee->fresh();

            return [
                'draft' => $draft,
                'employee' => $employee,
                'next_step' => $this->getNextStep($draft->completed_steps ?? []),
            ];
        });
    }

    /*
    |--------------------------------------------------------------------------
    | STEP 5 - EMERGENCY CONTACT
    |--------------------------------------------------------------------------
    */

    protected function saveEmergencyContact(EmployeeOnboardingDraft $draft, array $data): array
    {
        return DB::transaction(function () use ($draft, $data) {
            $employee = $this->getEmployee($draft);

            EmployeeEmergencyContact::where('employee_id', $employee->id)->delete();

            EmployeeEmergencyContact::create([
                'employee_id' => $employee->id,
                'contact_name' => $data['name'],
                'relationship' => $data['relationship'],
                'phone' => $data['phone'],
                'alternate_phone' => $data['alternate_phone'] ?? null,
                'address' => $data['address'] ?? null,
            ]);

            $this->markStepCompleted($draft, 5, $data);

            $draft = $draft->fresh();
            $employee = $employee->fresh();

            return [
                'draft' => $draft,
                'employee' => $employee,
                'next_step' => $this->getNextStep($draft->completed_steps ?? []),
            ];
        });
    }

    /*
    |--------------------------------------------------------------------------
    | STEP 6 - COMPENSATION
    |--------------------------------------------------------------------------
    */

    protected function saveCompensation(EmployeeOnboardingDraft $draft, array $data): array
    {
        return DB::transaction(function () use ($draft, $data) {
            $employee = $this->getEmployee($draft);

            EmployeeCompensation::updateOrCreate(
                ['employee_id' => $employee->id],
                [
                    'salary_type' => $data['salary_type'] ?? 'annual',
                    'annual_ctc' => $data['annual_ctc'] ?? 0,
                    'basic_salary' => $data['basic_salary'] ?? null,
                    'hra' => $data['hra'] ?? null,
                    'other_allowances' => $data['other_allowances'] ?? null,
                    'bonus' => $data['bonus'] ?? null,
                    'pay_frequency' => $data['pay_frequency'] ?? 'monthly',
                    'effective_from' => $data['effective_from'] ?? now(),
                ]
            );

            $employee->update([
                'salary' => $data['annual_ctc'] ?? 0,
            ]);
            $this->markStepCompleted($draft, 6, $data);

            $draft = $draft->fresh();
            $employee = $employee->fresh();

            return [
                'draft' => $draft,
                'employee' => $employee,
                'next_step' => $this->getNextStep($draft->completed_steps ?? []),
            ];
        });
    }

    /*
    |--------------------------------------------------------------------------
    | STEP 7 - BANK & PAYROLL
    |--------------------------------------------------------------------------
    */

    protected function saveBankDetails(EmployeeOnboardingDraft $draft, array $data): array
    {
        return DB::transaction(function () use ($draft, $data) {
            $employee = $this->getEmployee($draft);

            EmployeeBankDetail::updateOrCreate(
                ['employee_id' => $employee->id],
                [
                    'bank_name' => $data['bank_name'] ?? null,
                    'account_holder_name' => $data['account_holder_name'] ?? null,
                    'account_number' => $data['account_number'] ?? null,
                    'ifsc_code' => strtoupper($data['ifsc_code'] ?? ''),
                    'account_type' => $data['account_type'] ?? 'savings',
                    'pan' => $data['pan'] ?? null,
                    'uan' => $data['uan'] ?? null,
                    'pf_number' => $data['pf_number'] ?? null,
                ]
            );

            $this->markStepCompleted($draft, 7, $data);

            $draft = $draft->fresh();
            $employee = $employee->fresh();

            return [
                'draft' => $draft,
                'employee' => $employee,
                'next_step' => $this->getNextStep($draft->completed_steps ?? []),
            ];
        });
    }

    /*
    |--------------------------------------------------------------------------
    | STEP 8 - DOCUMENTS
    |--------------------------------------------------------------------------
    */

    protected function saveDocuments(EmployeeOnboardingDraft $draft, array $data): array
    {
        return DB::transaction(function () use ($draft, $data) {
            $employee = $this->getEmployee($draft);

            foreach ($data['documents'] as $document) {
                $file = $document['document'] ?? null;

                $existingDocument = EmployeeDocument::where('employee_id', $employee->id)
                    ->where('document_type', $document['document_type'])
                    ->first();

                $documentData = [
                    'document_number' => $document['document_number'] ?? null,
                    'status' => $document['status'] ?? 'pending',
                    'uploaded_by' => auth()->id(),
                ];

                if ($file) {
                    $path = $file->store("employees/documents/{$employee->id}", 'private');

                    $documentData['file_path'] = $path;
                    $documentData['file_name'] = $file->getClientOriginalName();
                    $documentData['mime_type'] = $file->getMimeType();
                    $documentData['file_size'] = $file->getSize();
                }

                if ($existingDocument) {
                    $existingDocument->update($documentData);
                } else {
                    EmployeeDocument::create(array_merge([
                        'employee_id' => $employee->id,
                        'document_type' => $document['document_type'],
                        'file_path' => null,
                        'file_name' => null,
                        'mime_type' => null,
                        'file_size' => null,
                    ], $documentData));
                }
            }

            $this->markStepCompleted($draft, 8, $data);

            $draft = $draft->fresh();
            $employee = $employee->fresh();

            return [
                'draft' => $draft,
                'employee' => $employee,
                'next_step' => $this->getNextStep($draft->completed_steps ?? []),
            ];
        });
    }

    /*
    |--------------------------------------------------------------------------
    | STEP 9 - EDUCATION & EXPERIENCE
    |--------------------------------------------------------------------------
    */

    protected function saveProfessionalInfo(EmployeeOnboardingDraft $draft, array $data): array
    {
        return DB::transaction(function () use ($draft, $data) {
            $employee = $this->getEmployee($draft);

            EmployeeEducation::updateOrCreate(
                ['employee_id' => $employee->id],
                [
                    'qualification' => $data['highest_qualification'],
                    'institution' => $data['university_institution'] ?? null,
                    'university' => $data['university_institution'] ?? null,
                ]
            );

            EmployeeExperience::updateOrCreate(
                ['employee_id' => $employee->id],
                [
                    'years_of_experience' => $data['years_of_experience'],
                    'previous_company' => $data['previous_company'] ?? null,
                    'languages' => isset($data['languages']) ? json_encode($data['languages']) : null,
                ]
            );

            $this->markStepCompleted($draft, 9, $data);

            $draft = $draft->fresh();
            $employee = $employee->fresh();

            return [
                'draft' => $draft,
                'employee' => $employee,
                'next_step' => $this->getNextStep($draft->completed_steps ?? []),
            ];
        });
    }

    /*
    |--------------------------------------------------------------------------
    | STEP 10 - LEAVE & ATTENDANCE
    |--------------------------------------------------------------------------
    */

    protected function saveLeaveAttendance(EmployeeOnboardingDraft $draft, array $data): array
    {
        return DB::transaction(function () use ($draft, $data) {
            $employee = $this->getEmployee($draft);

            EmployeeLeaveAttendance::updateOrCreate(
                ['employee_id' => $employee->id],
                [
                    'leave_policy_id' => $data['leave_policy_id'] ?? null,
                    'attendance_policy_id' => $data['attendance_policy_id'] ?? null,
                    'work_schedule_id' => $data['work_schedule_id'] ?? null,
                    'shift_id' => $data['shift_id'] ?? null,
                    'weekly_off_id' => $data['weekly_off_id'] ?? null,
                    'late_policy_id' => $data['late_policy_id'] ?? null,
                    'overtime_policy_id' => $data['overtime_policy_id'] ?? null,
                ]
            );

            $this->markStepCompleted($draft, 10, $data);

            $draft = $draft->fresh();
            $employee = $employee->fresh();

            return [
                'draft' => $draft,
                'employee' => $employee,
                'next_step' => $this->getNextStep($draft->completed_steps ?? []),
            ];
        });
    }

    /*
    |--------------------------------------------------------------------------
    | STEP 11 - ONBOARDING
    |--------------------------------------------------------------------------
    */

    protected function saveOnboarding(EmployeeOnboardingDraft $draft, array $data): array
    {
        return DB::transaction(function () use ($draft, $data) {
            $employee = $this->getEmployee($draft);

            if (!empty($data['assigned_buddy_id'])) {
                $buddyExists = User::where('id', $data['assigned_buddy_id'])->where('is_active', true)->exists();

                if (!$buddyExists) {
                    throw ValidationException::withMessages([
                        'assigned_buddy_id' => ['The selected buddy must be an active user.'],
                    ]);
                }
            }

            $onboarding = EmployeeOnboarding::updateOrCreate(
                ['employee_id' => $employee->id],
                [
                    'onboarding_status' => $data['onboarding_status'],
                    'start_date' => \Carbon\Carbon::createFromFormat('d-m-Y', $data['onboarding_start_date'])->format('Y-m-d'),
                    'checklist_id' => $data['onboarding_checklist_id'] ?? null,
                    'assigned_buddy_id' => $data['assigned_buddy_id'] ?? null,
                    'hr_notes' => $data['hr_notes'] ?? null,
                ]
            );

            $equipment = [];

            foreach ($data['equipment_required'] ?? [] as $equipmentId) {
                $equipment[$equipmentId] = [
                    'status' => 'required',
                ];
            }

            $onboarding->equipment()->sync($equipment);

            $this->markStepCompleted($draft, 11, $data);

            $draft = $draft->fresh();
            $employee = $employee->fresh();

            return [
                'draft' => $draft,
                'employee' => $employee,
                'next_step' => $this->getNextStep($draft->completed_steps ?? []),
            ];
        });
    }

    /*
    |--------------------------------------------------------------------------
    | COMPLETE ONBOARDING
    |--------------------------------------------------------------------------
    */

    public function complete(EmployeeOnboardingDraft $draft): array
    {
        $this->ensureDraftIsActive($draft);

        // Held in memory only, for the single email below. Never persisted,
        // queued, logged or returned.
        $temporaryPassword = null;

        $result = DB::transaction(function () use ($draft, &$temporaryPassword) {
            $draft->refresh();

            $employee = $draft->employee;

            if (!$employee) {
                throw ValidationException::withMessages([
                    'employee' => ['Employee has not been created. Please complete Step 1 first.'],
                ]);
            }

            $completedSteps = $draft->completed_steps ?? [];
            $requiredSteps = range(1, 11);
            $missingSteps = array_values(array_diff($requiredSteps, $completedSteps));

            if (!empty($missingSteps)) {
                throw ValidationException::withMessages([
                    'steps' => ['Please complete all onboarding steps.'],
                    'missing_steps' => $missingSteps,
                ]);
            }

            if (!$employee->user_id) {
                throw ValidationException::withMessages([
                    'user' => ['Employee login account has not been created. Please complete Step 3 first.'],
                ]);
            }

            $user = User::findOrFail($employee->user_id);

            $onboarding = $employee->onboarding;

            if (!$onboarding) {
                throw ValidationException::withMessages([
                    'onboarding' => ['Employee onboarding record was not found. Please complete Step 11 first.'],
                ]);
            }

            // A first-time account (never signed in, still forced to change its
            // password) receives its initial credentials now.
            if ($user->must_change_password && $user->last_login_at === null) {
                $temporaryPassword = TemporaryPasswordGenerator::generate();

                $user->forceFill([
                    'password' => Hash::make($temporaryPassword),
                    'must_change_password' => true,
                ])->save();
            }

            $employee->update([
                'employment_status' => 'Active',
                'lifecycle' => 'Employed',
            ]);

            $onboarding->update([
                'onboarding_status' => 'completed',
            ]);

            $draft->update([
                'status' => 'completed',
                'current_step' => 11,
                'updated_by' => auth()->id(),
                'completed_at' => now(),
                'last_saved_at' => now(),
            ]);

            $onboarding->update([
                'temporary_password' => null,
            ]);

            return [
                'user' => $user->fresh(),
                'employee' => $employee->fresh(),
                'draft' => $draft->fresh(),
                'onboarding' => $onboarding->fresh(),
                'email_sent' => false,
            ];
        });

        if ($temporaryPassword !== null) {
            $result['email_sent'] = $this->sendWelcomeEmail($result['user'], $temporaryPassword);
        }

        return $result;
    }

    /**
     * Sends the credentials immediately (in-process). The plaintext is never
     * put on a queue; a delivery failure is logged without any credential.
     */
    protected function sendWelcomeEmail(User $user, string $temporaryPassword): bool
    {
        try {
            Mail::to($user->email)->send(new EmployeeWelcomeMail($user, $temporaryPassword));

            return true;
        } catch (Throwable $exception) {
            Log::error('Welcome email could not be delivered.', [
                'user_id' => $user->id,
                'exception' => $exception::class,
            ]);

            return false;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | MARK STEP COMPLETED
    |--------------------------------------------------------------------------
    */

    protected function markStepCompleted(EmployeeOnboardingDraft $draft, int $step, array $data): void
    {
        $completedSteps = $draft->completed_steps ?? [];

        if (!in_array($step, $completedSteps, true)) {
            $completedSteps[] = $step;
        }

        sort($completedSteps);

        $nextStep = $this->getNextStep($completedSteps);

        $draft->update([
            'completed_steps' => $completedSteps,
            'current_step' => $nextStep ?? 11,
            'updated_by' => auth()->id(),
            'last_saved_at' => now(),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | GET NEXT STEP
    |--------------------------------------------------------------------------
    */

    protected function getNextStep(array $completedSteps): ?int
    {
        for ($step = 1; $step <= 11; $step++) {
            if (!in_array($step, $completedSteps, true)) {
                return $step;
            }
        }

        return null;
    }

    /*
    |--------------------------------------------------------------------------
    | GET EMPLOYEE
    |--------------------------------------------------------------------------
    */

    protected function getEmployee(EmployeeOnboardingDraft $draft): Employee
    {
        if (!$draft->employee_id) {
            throw ValidationException::withMessages([
                'employee' => ['Employee must be created in Step 1 before continuing.'],
            ]);
        }

        $employee = Employee::find($draft->employee_id);

        if (!$employee) {
            throw ValidationException::withMessages([
                'employee' => ['Employee associated with this draft was not found.'],
            ]);
        }

        return $employee;
    }

    /*
    |--------------------------------------------------------------------------
    | ENSURE EMPLOYEE EXISTS
    |--------------------------------------------------------------------------
    */

    protected function ensureEmployeeExists(EmployeeOnboardingDraft $draft): void
    {
        $this->getEmployee($draft);
    }

    /*
    |--------------------------------------------------------------------------
    | ENSURE DRAFT ACTIVE
    |--------------------------------------------------------------------------
    */

    protected function ensureDraftIsActive(EmployeeOnboardingDraft $draft): void
    {
        if ($draft->status !== 'draft') {
            throw ValidationException::withMessages([
                'draft' => ['This onboarding draft is no longer active.'],
            ]);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | SAVE BASE64 PROFILE PHOTO
    |--------------------------------------------------------------------------
    */

    protected function saveBase64ProfilePhoto(string $base64, int $employeeId): string
    {
        if (!preg_match('/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/s', $base64, $matches)) {
            throw ValidationException::withMessages([
                'profile_photo' => ['Invalid profile photo format.'],
            ]);
        }

        $extension = strtolower($matches[1]);

        if ($extension === 'jpeg') {
            $extension = 'jpg';
        }

        $imageData = base64_decode($matches[2], true);

        if ($imageData === false) {
            throw ValidationException::withMessages([
                'profile_photo' => ['Invalid Base64 image data.'],
            ]);
        }

        if (strlen($imageData) > 2 * 1024 * 1024) {
            throw ValidationException::withMessages([
                'profile_photo' => ['Profile photo must not exceed 2 MB.'],
            ]);
        }

        $imageInfo = getimagesizefromstring($imageData);

        if ($imageInfo === false) {
            throw ValidationException::withMessages([
                'profile_photo' => ['Uploaded data is not a valid image.'],
            ]);
        }

        $filename = Str::uuid()->toString() . '.' . $extension;

        $path = "employees/profile-photos/{$employeeId}/{$filename}";

        Storage::disk('private')->put($path, $imageData);

        return $path;
    }
}
