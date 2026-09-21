<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\EmployeeCompensation;
use Carbon\Carbon;
use Illuminate\Validation\ValidationException;

/**
 * Deterministic monthly payroll figures from the employee's real
 * `employee_compensations` row. Nothing is invented:
 *
 *  - salary_type = annual  -> basic_salary, hra, other_allowances are ANNUAL
 *    amounts; each is divided by 12.
 *  - salary_type = monthly -> monthly_basic_salary, monthly_hra,
 *    monthly_special_allowance, monthly_other_allowances are used as stored.
 *  - gross      = sum of the earning components above.
 *  - deductions = employee_pf + employee_esi + professional_tax exactly as
 *    stored (annual amounts /12 for annual rows, otherwise as stored).
 *  - net        = gross - deductions.
 *
 * NOT implemented because no rule/config exists anywhere in the project:
 * statutory PF/ESI/TDS/professional-tax formulas, bonus payout timing (the
 * `bonus` / `annual_bonus` columns are excluded), overtime pay, and
 * loss-of-pay from absences or unpaid leave.
 */
class PayrollCalculationService
{
    /**
     * @return array<string, mixed>
     */
    public function calculate(Employee $employee, int $month, int $year): array
    {
        $monthStart = Carbon::create($year, $month, 1)->startOfDay();
        $monthEnd = $monthStart->copy()->endOfMonth();

        if ($employee->employment_status !== 'Active') {
            throw ValidationException::withMessages([
                'employee_id' => ['Payroll can only be prepared for active employees.'],
            ]);
        }

        if ($employee->joining_date && Carbon::parse($employee->joining_date)->gt($monthEnd)) {
            throw ValidationException::withMessages([
                'payroll_month' => ['The employee had not joined by the end of the selected month.'],
            ]);
        }

        $compensation = EmployeeCompensation::query()
            ->where('employee_id', $employee->id)
            ->whereDate('effective_from', '<=', $monthEnd->toDateString())
            ->where(fn ($q) => $q->whereNull('effective_to')->orWhereDate('effective_to', '>=', $monthStart->toDateString()))
            ->orderByDesc('effective_from')
            ->orderByDesc('id')
            ->first();

        if (! $compensation) {
            throw ValidationException::withMessages([
                'employee_id' => ['No compensation is effective for this employee in the selected month.'],
            ]);
        }

        $annual = $compensation->salary_type === 'annual';
        $toMonthly = fn ($value) => $annual ? (float) $value / 12 : (float) $value;

        $earnings = $annual
            ? [
                'basic_salary' => $toMonthly($compensation->basic_salary),
                'hra' => $toMonthly($compensation->hra),
                'other_allowances' => $toMonthly($compensation->other_allowances),
            ]
            : [
                'basic_salary' => $toMonthly($compensation->monthly_basic_salary),
                'hra' => $toMonthly($compensation->monthly_hra),
                'special_allowance' => $toMonthly($compensation->monthly_special_allowance),
                'other_allowances' => $toMonthly($compensation->monthly_other_allowances),
            ];

        $deductions = [
            'employee_pf' => $toMonthly($compensation->employee_pf),
            'employee_esi' => $toMonthly($compensation->employee_esi),
            'professional_tax' => $toMonthly($compensation->professional_tax),
        ];

        $gross = $this->money(array_sum($earnings));

        if ($gross <= 0) {
            throw ValidationException::withMessages([
                'employee_id' => ['The employee\'s compensation has no salary components, so payroll cannot be calculated.'],
            ]);
        }

        $totalDeductions = $this->money(array_sum($deductions));

        if ($totalDeductions > $gross) {
            throw ValidationException::withMessages([
                'employee_id' => ['The employee\'s stored deductions exceed the gross salary.'],
            ]);
        }

        return [
            'employee_id' => $employee->id,
            'payroll_month' => $month,
            'payroll_year' => $year,
            'basic_salary' => $this->money($earnings['basic_salary']),
            'gross_salary' => $gross,
            'total_deductions' => $totalDeductions,
            'net_salary' => $this->money($gross - $totalDeductions),
            'breakdown' => [
                'earnings' => array_map(fn ($v) => $this->money($v), $earnings),
                'deductions' => array_map(fn ($v) => $this->money($v), $deductions),
            ],
            'source' => [
                'compensation_id' => $compensation->id,
                'salary_type' => $compensation->salary_type,
                'effective_from' => $compensation->effective_from?->toDateString(),
                'notes' => [
                    'Bonus, overtime, statutory formulas and loss of pay are not applied.',
                ],
            ],
        ];
    }

    private function money(float|int $value): float
    {
        return round((float) $value, 2, PHP_ROUND_HALF_UP);
    }
}
