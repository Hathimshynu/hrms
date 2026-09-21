<?php

namespace App\Http\Requests\LeaveEntitlement;

use Illuminate\Foundation\Http\FormRequest;

/** Only the number of days is editable; employee, leave type and year identify the entitlement. */
class UpdateLeaveEntitlementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'entitled_days' => ['required', 'numeric', 'decimal:0,2', 'min:0', 'max:366'],
        ];
    }

    public function messages(): array
    {
        return [
            'entitled_days.decimal' => 'Entitled days can have at most 2 decimal places.',
            'entitled_days.max' => 'Entitled days cannot exceed 366.',
            'entitled_days.min' => 'Entitled days cannot be negative.',
        ];
    }
}
