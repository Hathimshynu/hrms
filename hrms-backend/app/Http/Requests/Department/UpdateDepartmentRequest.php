<?php

namespace App\Http\Requests\Department;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDepartmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255', Rule::unique('departments', 'name')->ignore($this->route('department'))->withoutTrashed()],
            'code' => ['sometimes', 'string', 'max:50', Rule::unique('departments', 'code')->ignore($this->route('department'))->withoutTrashed()],
            'head_id' => ['nullable', 'exists:users,id'],
            'status' => ['sometimes', 'in:Active,Inactive,Under Review'],
            'type' => ['sometimes', 'in:Technical,Non-Technical,Administrative'],
            'description' => ['nullable', 'string'],
        ];
    }
}
