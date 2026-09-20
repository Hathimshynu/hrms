<?php

namespace App\Http\Requests\Absence;

use App\Services\AbsenceCalculationService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AbsenceRangeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'from_date' => ['nullable', 'date_format:Y-m-d'],
            'to_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from_date'],
            'employee_id' => ['nullable', 'integer'],
            'department_id' => ['nullable', 'integer'],
            'status' => ['nullable', Rule::in(AbsenceCalculationService::STATUSES)],
            'per_page' => ['nullable', 'integer', 'between:1,100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }

    public function messages(): array
    {
        return [
            'to_date.after_or_equal' => 'To date cannot be before the from date.',
        ];
    }
}
