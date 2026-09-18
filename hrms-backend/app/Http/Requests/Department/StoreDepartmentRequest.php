<?php

namespace App\Http\Requests\Department;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDepartmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('departments', 'name')->withoutTrashed()],
            'code' => ['required', 'string', 'max:50', Rule::unique('departments', 'code')->withoutTrashed()],
            'head_id' => ['nullable', 'exists:users,id'],
            'status' => ['required', 'in:Active,Inactive,Under Review'],
            'type' => ['required', 'in:Technical,Non-Technical,Administrative'],
            'description' => ['nullable', 'string'],
        ];
    }
}
