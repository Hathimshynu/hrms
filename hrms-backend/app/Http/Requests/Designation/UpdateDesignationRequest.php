<?php

namespace App\Http\Requests\Designation;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDesignationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255', Rule::unique('designations', 'name')->ignore($this->route('designation'))->withoutTrashed()],
            'code' => ['sometimes', 'string', 'max:50', Rule::unique('designations', 'code')->ignore($this->route('designation'))->withoutTrashed()],
            'department_id' => ['sometimes', 'exists:departments,id'],
            'level' => ['sometimes', 'in:Entry,Mid,Senior,Lead,Manager'],
            'status' => ['sometimes', 'in:Active,Inactive,Under Review'],
            'description' => ['nullable', 'string'],
        ];
    }
}
