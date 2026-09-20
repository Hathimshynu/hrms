<?php

namespace App\Http\Requests\Leave;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LeaveListRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['nullable', Rule::in(['pending', 'approved', 'rejected', 'cancelled'])],
            'leave_type' => ['nullable', 'string', 'max:50'],
            'employee_id' => ['nullable', 'integer'],
            'department_id' => ['nullable', 'integer'],
            'from_date' => ['nullable', 'date_format:Y-m-d'],
            'to_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from_date'],
            'year' => ['nullable', 'integer', 'between:2000,2100'],
            'per_page' => ['nullable', 'integer', 'between:1,100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
