<?php

namespace App\Http\Requests\Report;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * One filter contract for every report endpoint (and its export). The
 * allowed `status` values depend on which report is being requested.
 */
class ReportFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<int, string> */
    private function statuses(): array
    {
        // Named routes are reports.<name> / reports.export; the export carries the report in the path.
        $report = $this->route('report') ?? str_replace('reports.', '', (string) $this->route()?->getName());

        return match ($report) {
            'workforce' => ['Onboarding', 'Active', 'Inactive', 'Invited', 'On Leave', 'Terminated'],
            'leave' => ['pending', 'approved', 'rejected', 'cancelled'],
            'payroll' => ['draft', 'processed', 'paid', 'cancelled'],
            'attendance', 'absence' => ['present', 'absent', 'leave', 'weekly_off', 'holiday', 'upcoming'],
            'holidays' => ['active', 'inactive'],
            default => [],
        };
    }

    public function rules(): array
    {
        return [
            'from_date' => ['nullable', 'date_format:Y-m-d'],
            'to_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from_date'],
            'period' => ['nullable', 'date_format:Y-m'],
            'month' => ['nullable', 'integer', 'between:1,12'],
            'year' => ['nullable', 'integer', 'between:2000,2100'],
            'department_id' => ['nullable', 'integer', 'exists:departments,id'],
            'employee_id' => ['nullable', 'integer', 'exists:employees,id'],
            'status' => ['nullable', 'string', Rule::in($this->statuses())],
            'leave_type' => ['nullable', 'string', 'max:50'],
            'sort_by' => ['nullable', 'string', 'max:40'],
            'sort_dir' => ['nullable', Rule::in(['asc', 'desc'])],
            'per_page' => ['nullable', 'integer', 'between:1,100'],
            'page' => ['nullable', 'integer', 'min:1'],
            'format' => ['nullable', Rule::in(['csv', 'xlsx'])],
        ];
    }

    public function messages(): array
    {
        return [
            'to_date.after_or_equal' => 'To date cannot be before the from date.',
            'department_id.exists' => 'The selected department does not exist.',
            'employee_id.exists' => 'The selected employee does not exist.',
            'status.in' => 'The selected status is not valid for this report.',
        ];
    }
}
