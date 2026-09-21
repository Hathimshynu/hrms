<?php

namespace App\Http\Requests\LeaveEntitlement;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreLeaveEntitlementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'employee_id' => ['required', 'integer', Rule::exists('employees', 'id')->where('employment_status', 'Active')->whereNull('deleted_at')],
            'leave_policy_id' => ['required', 'integer', Rule::exists('leave_policies', 'id')->where('is_active', true)->whereNull('deleted_at')],
            'leave_year' => [
                'required', 'integer', 'between:2000,2100',
                Rule::unique('leave_entitlements', 'leave_year')
                    ->where('employee_id', $this->integer('employee_id'))
                    ->where('leave_policy_id', $this->integer('leave_policy_id')),
            ],
            'entitled_days' => ['required', 'numeric', 'decimal:0,2', 'min:0', 'max:366'],
        ];
    }

    public function messages(): array
    {
        return [
            'employee_id.exists' => 'Select an active employee.',
            'leave_policy_id.exists' => 'Select an active leave type.',
            'leave_year.unique' => 'An entitlement already exists for this employee, leave type and year. Edit it instead.',
            'leave_year.between' => 'Leave year must be between 2000 and 2100.',
            'entitled_days.decimal' => 'Entitled days can have at most 2 decimal places.',
            'entitled_days.max' => 'Entitled days cannot exceed 366.',
            'entitled_days.min' => 'Entitled days cannot be negative.',
        ];
    }
}
