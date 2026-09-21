<?php

namespace App\Http\Requests\Holiday;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateHolidayRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:150'],
            'holiday_date' => ['sometimes', 'required', 'date_format:Y-m-d', 'after_or_equal:2000-01-01', 'before_or_equal:2100-12-31', Rule::unique('holidays', 'holiday_date')->ignore($this->route('holiday'))],
            'description' => ['nullable', 'string', 'max:500'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Holiday name is required.',
            'holiday_date.date_format' => 'Holiday date must be a valid date.',
            'holiday_date.unique' => 'A holiday is already defined for this date.',
            'holiday_date.after_or_equal' => 'Holiday date must be between the years 2000 and 2100.',
            'holiday_date.before_or_equal' => 'Holiday date must be between the years 2000 and 2100.',
        ];
    }
}
