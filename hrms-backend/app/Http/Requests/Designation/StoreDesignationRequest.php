<?php

namespace App\Http\Requests\Designation;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDesignationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('designations', 'name')->withoutTrashed()],
            'code' => ['required', 'string', 'max:50', Rule::unique('designations', 'code')],
            'department_id' => ['required', 'exists:departments,id'],
            'level' => ['required', 'in:Entry,Mid,Senior,Lead,Manager'],
            'status' => ['required', 'in:Active,Inactive,Under Review'],
            'description' => ['nullable', 'string'],
        ];
    }
}
