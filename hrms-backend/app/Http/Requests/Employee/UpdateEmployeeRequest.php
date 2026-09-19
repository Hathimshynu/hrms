<?php

namespace App\Http\Requests\Employee;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEmployeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('email')) {
            $this->merge([
                'email' => strtolower(trim((string) $this->input('email'))),
            ]);
        }
    }

    public function rules(): array
    {
        $employee = $this->route('employee');

        return [
            'first_name' => [
                'sometimes',
                'string',
                'max:255',
            ],

            'last_name' => [
                'sometimes',
                'string',
                'max:255',
            ],

            'email' => [
                'sometimes',
                'email:rfc',
                'max:255',
                Rule::unique('employees', 'email')
                    ->ignore($employee->id)
                    ->withoutTrashed(),
            ],

            'phone' => [
                'nullable',
                'string',
                'max:20',
            ],

            'date_of_birth' => [
                'nullable',
                'date',
            ],

            'gender' => [
                'nullable',
                'in:Male,Female,Other,Prefer not to say',
            ],

            'marital_status' => [
                'nullable',
                'in:Single,Married,Divorced,Widowed',
            ],

            'alternate_phone' => [
                'nullable',
                'string',
                'max:20',
            ],

            'employment_type' => [
                'sometimes',
                'in:Full Time,Part Time,Contract,Intern,Temporary',
            ],

            'probation_end_date' => [
                'nullable',
                'date',
            ],

            'joining_date' => [
                'nullable',
                'date',
            ],

            'department_id' => [
                'nullable',
                'exists:departments,id',
            ],

            'designation_id' => [
                'nullable',
                'exists:designations,id',
            ],


            'reporting_manager_id' => [
                'nullable',
                'integer',
                'exists:employees,id',
            ],

            'employment_level_id' => [
                'nullable',
                'integer',
            ],

            'work_mode' => [
                'nullable',
                'in:Office,Remote,Hybrid',
            ],

            'employment_status' => [
                'sometimes',
                'in:Active,Inactive,Invited,On Leave,Terminated',
            ],

            'profile_photo' => [
                'nullable',
                'string',
                'max:255',
            ],
        ];
    }
}