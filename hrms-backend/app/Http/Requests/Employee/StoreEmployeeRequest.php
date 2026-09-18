<?php

namespace App\Http\Requests\Employee;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEmployeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'email' => strtolower(trim((string) $this->input('email'))),
        ]);
    }

    public function rules(): array
    {
        return [
            'role_id' => [
                'nullable',
                'integer',
                'exists:roles,id',
            ],

            'first_name' => [
                'required',
                'string',
                'max:255',
            ],

            'last_name' => [
                'required',
                'string',
                'max:255',
            ],

            'email' => [
                'required',
                'email:rfc',
                'max:255',
                'unique:employees,email',
                'unique:users,email',
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
                'nullable',
                'in:full_time,part_time,contract,intern',
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
                'in:office,remote,hybrid',
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