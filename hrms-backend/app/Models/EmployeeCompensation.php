<?php

namespace App\Models;

use App\Models\Concerns\FormatsModelDates;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class EmployeeCompensation extends Model
{
    use FormatsModelDates, HasFactory, SoftDeletes;

    protected $table = 'employee_compensations';

    protected $fillable = [
        'employee_id',
        'salary_type',
        'pay_frequency',
        'annual_ctc',
        'monthly_ctc',
        'basic_salary',
        'hra',
        'other_allowances',
        'bonus',
        'monthly_basic_salary',
        'monthly_hra',
        'monthly_special_allowance',
        'monthly_other_allowances',
        'monthly_gross_salary',
        'annual_bonus',
        'employer_pf',
        'employer_esi',
        'employer_gratuity',
        'other_employer_benefits',
        'employee_pf',
        'employee_esi',
        'professional_tax',
        'effective_from',
        'effective_to',
        'is_current',
    ];

    protected function casts(): array
    {
        return [
            'annual_ctc' => 'decimal:2',
            'monthly_ctc' => 'decimal:2',
            'basic_salary' => 'decimal:2',
            'hra' => 'decimal:2',
            'other_allowances' => 'decimal:2',
            'bonus' => 'decimal:2',
            'monthly_basic_salary' => 'decimal:2',
            'monthly_hra' => 'decimal:2',
            'monthly_special_allowance' => 'decimal:2',
            'monthly_other_allowances' => 'decimal:2',
            'monthly_gross_salary' => 'decimal:2',
            'annual_bonus' => 'decimal:2',
            'employer_pf' => 'decimal:2',
            'employer_esi' => 'decimal:2',
            'employer_gratuity' => 'decimal:2',
            'other_employer_benefits' => 'decimal:2',
            'employee_pf' => 'decimal:2',
            'employee_esi' => 'decimal:2',
            'professional_tax' => 'decimal:2',
            'effective_from' => 'date',
            'effective_to' => 'date',
            'is_current' => 'boolean',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}