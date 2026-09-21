<?php

namespace App\Http\Requests\Payroll;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePayrollRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    // Either recalculate from the current compensation, or adjust the draft's
    // figures manually. Net is always derived server-side.
    public function rules(): array
    {
        return [
            'recalculate' => ['nullable', 'boolean'],
            'basic_salary' => ['nullable', 'numeric', 'min:0', 'max:9999999999.99'],
            'gross_salary' => ['nullable', 'numeric', 'min:0', 'max:9999999999.99'],
            'total_deductions' => ['nullable', 'numeric', 'min:0', 'max:9999999999.99'],
        ];
    }
}
