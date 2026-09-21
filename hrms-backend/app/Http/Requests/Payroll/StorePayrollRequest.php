<?php

namespace App\Http\Requests\Payroll;

use Illuminate\Foundation\Http\FormRequest;

class StorePayrollRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    // Amounts are never accepted from the client on create: they are always
    // calculated server-side from the employee's compensation.
    public function rules(): array
    {
        return [
            'employee_id' => ['required', 'integer', 'exists:employees,id'],
            'payroll_month' => ['required', 'integer', 'between:1,12'],
            'payroll_year' => ['required', 'integer', 'between:2000,2100'],
        ];
    }

    public function messages(): array
    {
        return [
            'employee_id.required' => 'Select an employee.',
            'employee_id.exists' => 'The selected employee does not exist.',
        ];
    }
}
