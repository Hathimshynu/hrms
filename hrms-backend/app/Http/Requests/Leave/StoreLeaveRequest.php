<?php

namespace App\Http\Requests\Leave;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreLeaveRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // leave_requests.leave_type stores the code of an active leave policy.
            'leave_type' => ['required', 'string', 'max:50', Rule::exists('leave_policies', 'code')->where('is_active', true)->whereNull('deleted_at')],
            'start_date' => ['required', 'date_format:Y-m-d'],
            'end_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:start_date'],
            'reason' => ['required', 'string', 'max:500'],
            // Never used to pick the employee; only checked so a foreign id is refused.
            'employee_id' => ['nullable', 'integer'],
        ];
    }

    public function messages(): array
    {
        return [
            'leave_type.exists' => 'Select an active leave type.',
            'start_date.date_format' => 'From date must be a valid date.',
            'end_date.date_format' => 'To date must be a valid date.',
            'end_date.after_or_equal' => 'To date cannot be before the from date.',
            'reason.required' => 'Please provide a reason for the leave.',
        ];
    }
}
