<?php

namespace App\Http\Requests;

use App\Models\EmployeeOnboardingDraft;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Models\Employee;

class SaveEmployeeDraftRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $step = (int) $this->route('step');

        return array_merge([
            'draft_id' => ['required', 'integer', 'exists:employee_onboarding_drafts,id'],
        ], match ($step) {
            1 => $this->stepOneRules(),
            2 => $this->stepTwoRules(),
            3 => $this->stepThreeRules(),
            4 => $this->stepFourRules(),
            5 => $this->stepFiveRules(),
            6 => $this->stepSixRules(),
            7 => $this->stepSevenRules(),
            8 => $this->stepEightRules(),
            9 => $this->stepNineRules(),
            10 => $this->stepTenRules(),
            11 => $this->stepElevenRules(),
            default => [],
        });
    }

    protected function draftEmployeeId(): ?int
    {
        $draftId = $this->input('draft_id');

        if (!$draftId) {
            return null;
        }

        return EmployeeOnboardingDraft::where('id', $draftId)->value('employee_id');
    }

    protected function stepOneRules(): array
    {
        $employeeId = $this->draftEmployeeId();

        return [
            'profile_photo' => ['nullable', 'string'],
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:255', Rule::unique('employees', 'email')->ignore($employeeId)->withoutTrashed()],
            'phone' => ['required', 'string', 'max:20', Rule::unique('employees', 'phone')->ignore($employeeId)->withoutTrashed()],
            'alternate_phone' => ['nullable', 'string', 'max:20'],
            'date_of_birth' => ['required', 'date', 'before:today'],
            'gender' => ['required', 'string', 'max:30'],
            'marital_status' => ['required', 'string', 'max:30'],
        ];
    }

    protected function stepTwoRules(): array
    {
        return [
            'employment_type' => ['required', 'string', 'max:50'],
            'probation_end_date' => ['nullable', 'date'],
            'joining_date' => ['required', 'date'],
            'department_id' => ['required', 'integer', 'exists:departments,id'],
            'designation_id' => ['required', 'integer', 'exists:designations,id'],
            'branch_id' => ['nullable', 'integer', 'exists:branches,id'],
            'location_id' => ['nullable', 'integer', 'exists:locations,id'],
            'reporting_manager_id' => ['nullable', 'integer', 'exists:employees,id'],
            'employment_level' => ['nullable', 'string', 'max:50'],
            'work_mode' => ['nullable', 'string', 'max:50'],
            'shift_id' => ['nullable', 'integer', 'exists:shifts,id'],
            'work_schedule_id' => ['nullable', 'integer', 'exists:work_schedules,id'],
        ];
    }

    protected function stepThreeRules(): array
    {
        $employeeId = $this->draftEmployeeId();

        $userId = null;

        if ($employeeId) {
            $userId = Employee::where('id', $employeeId)->value('user_id');
        }

        return [
            'work_email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($userId)->withoutTrashed()],
            'work_phone' => ['nullable', 'string', 'max:20'],
            'role_id' => ['required', 'integer', 'exists:roles,id'],
            'access_level' => ['required', 'string', Rule::in(['Organization', 'Branch', 'Department', 'Team', 'Self'])],
        ];
    }

    protected function stepFourRules(): array
    {
        return [
            'current_address.address_line_1' => ['required', 'string', 'max:255'],
            'current_address.address_line_2' => ['nullable', 'string', 'max:255'],
            'current_address.city' => ['required', 'string', 'max:100'],
            'current_address.state' => ['required', 'string', 'max:100'],
            'current_address.country' => ['required', 'string', 'max:100'],
            'current_address.postal_code' => ['required', 'string', 'max:20'],
            'same_as_current' => ['required', 'boolean'],
            'permanent_address.address_line_1' => ['required_if:same_as_current,false', 'nullable', 'string', 'max:255'],
            'permanent_address.address_line_2' => ['nullable', 'string', 'max:255'],
            'permanent_address.city' => ['required_if:same_as_current,false', 'nullable', 'string', 'max:100'],
            'permanent_address.state' => ['required_if:same_as_current,false', 'nullable', 'string', 'max:100'],
            'permanent_address.country' => ['required_if:same_as_current,false', 'nullable', 'string', 'max:100'],
            'permanent_address.postal_code' => ['required_if:same_as_current,false', 'nullable', 'string', 'max:20'],
        ];
    }

    protected function stepFiveRules(): array
    {
        return [
            'name' => ['required', 'string', 'max:150'],
            'relationship' => ['required', 'string', 'max:50'],
            'phone' => ['required', 'string', 'max:20'],
            'alternate_phone' => ['nullable', 'string', 'max:20'],
            'address' => ['nullable', 'string', 'max:1000'],
        ];
    }

    protected function stepSixRules(): array
    {
        return [
            'salary_type' => ['required', 'string', 'max:50'],
            'annual_ctc' => ['required', 'numeric', 'min:0'],
            'basic_salary' => ['required', 'numeric', 'min:0'],
            'hra' => ['nullable', 'numeric', 'min:0'],
            'other_allowances' => ['nullable', 'numeric', 'min:0'],
            'bonus' => ['nullable', 'numeric', 'min:0'],
            'pay_frequency' => ['required', 'string', 'max:50'],
            'effective_from' => ['required', 'date'],
        ];
    }

    protected function stepSevenRules(): array
    {
        return [
            'bank_name' => ['required', 'string', 'max:150'],
            'account_holder_name' => ['required', 'string', 'max:150'],
            'account_number' => ['required', 'string', 'max:50'],
            'ifsc_code' => ['required', 'string', 'max:20'],
            'account_type' => ['required', 'string', 'max:50'],
            'pan' => ['nullable', 'string', 'max:20'],
            'uan' => ['nullable', 'string', 'max:30'],
            'pf_number' => ['nullable', 'string', 'max:50'],
        ];
    }

    protected function stepEightRules(): array
    {
        return [
            'documents' => ['required', 'array', 'min:1'],
            'documents.*.document_type' => ['required', 'string', Rule::in(['Aadhaar Card', 'PAN Card', 'Driving Licence', 'Passport', 'Voter ID'])],
            'documents.*.status' => ['nullable', 'string', 'max:50'],
            'documents.*.document_number' => ['nullable', 'string', 'max:100'],
            'documents.*.document' => ['nullable', 'file', 'max:4096', 'mimes:pdf,jpg,jpeg,png'],
        ];
    }

    protected function stepNineRules(): array
    {
        return [
            'highest_qualification' => ['required', 'string', 'max:150'],
            'university_institution' => ['nullable', 'string', 'max:255'],
            'years_of_experience' => ['required', 'numeric', 'min:0'],
            'previous_company' => ['nullable', 'string', 'max:255'],
            'languages' => ['nullable', 'array'],
            'languages.*' => ['string', 'max:50'],
        ];
    }

    protected function stepTenRules(): array
    {
        return [
            'leave_policy_id' => ['required', 'integer', 'exists:leave_policies,id'],
            'attendance_policy_id' => ['required', 'integer', 'exists:attendance_policies,id'],
            'work_schedule_id' => ['required', 'integer', 'exists:work_schedules,id'],
            'shift_id' => ['required', 'integer', 'exists:shifts,id'],
            'weekly_off_id' => ['required', 'integer', 'exists:weekly_offs,id'],
            'late_policy_id' => ['required', 'integer', 'exists:late_policies,id'],
            'overtime_policy_id' => ['required', 'integer', 'exists:overtime_policies,id'],
        ];
    }

    protected function stepElevenRules(): array
    {
        return [
            'onboarding_status' => ['required', 'string', 'max:50', 'in:Pending,in_progress,completed'],
            'onboarding_start_date' => ['required', 'date_format:d-m-Y'],
            'onboarding_checklist_id' => ['nullable', 'integer', 'exists:onboarding_checklists,id'],
            'assigned_buddy_id' => ['nullable', 'integer', 'exists:users,id'],
            'equipment_required' => ['nullable', 'array'],
            'equipment_required.*' => ['integer', 'exists:equipment,id', 'distinct'],
            'hr_notes' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
