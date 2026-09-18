<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        /*
        |--------------------------------------------------------------------------
        | Roles
        |--------------------------------------------------------------------------
        */
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name', 125)->unique();
            $table->timestamps();
        });

        /*
        |--------------------------------------------------------------------------
        | Permissions
        |--------------------------------------------------------------------------
        */
        Schema::create('permissions', function (Blueprint $table) {
            $table->id();
            $table->string('name', 125)->unique();
            $table->timestamps();
        });

        /*
        |--------------------------------------------------------------------------
        | Users
        |--------------------------------------------------------------------------
        */
        Schema::create('users', function (Blueprint $table) {
            $table->id();

            $table->string('name');
            $table->string('email')->unique();

            $table->timestamp('email_verified_at')->nullable();

            $table->string('password');

            $table->unsignedBigInteger('role_id')->nullable();

            $table->unsignedInteger('token_version')->default(0);

            $table->boolean('is_active')->default(true);

            $table->ipAddress('last_login_ip')->nullable();
            $table->timestamp('last_login_at')->nullable();

            $table->boolean('must_change_password')->default(false);

            $table->string('google_id')->nullable()->unique();
            $table->string('google_avatar')->nullable();

            $table->rememberToken();

            $table->timestamps();
            $table->softDeletes();

            $table->foreign('role_id')
                ->references('id')
                ->on('roles')
                ->restrictOnDelete();

            $table->index('role_id');
            $table->index('is_active');
        });

        /*
        |--------------------------------------------------------------------------
        | Role Has Permissions
        |--------------------------------------------------------------------------
        */
        Schema::create('role_has_permissions', function (Blueprint $table) {
            $table->unsignedBigInteger('role_id');
            $table->unsignedBigInteger('permission_id');

            $table->primary([
                'role_id',
                'permission_id',
            ]);

            $table->foreign('role_id')
                ->references('id')
                ->on('roles')
                ->cascadeOnDelete();

            $table->foreign('permission_id')
                ->references('id')
                ->on('permissions')
                ->cascadeOnDelete();
        });

        /*
        |--------------------------------------------------------------------------
        | Employee Sequences
        |--------------------------------------------------------------------------
        */
        Schema::create('employee_sequences', function (Blueprint $table) {
            $table->id();

            $table->string('prefix', 50)->default('HRMS')->unique();

            $table->unsignedBigInteger('current_number')->default(0);

            $table->timestamps();
        });

        /*
        |--------------------------------------------------------------------------
        | Departments
        |--------------------------------------------------------------------------
        */
        Schema::create('departments', function (Blueprint $table) {
            $table->id();

            $table->string('name');
            $table->string('code')->unique();

            $table->foreignId('head_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->enum('status', [
                'Active',
                'Inactive',
                'Under Review',
            ])->default('Active');

            $table->enum('type', [
                'Technical',
                'Non-Technical',
                'Administrative',
            ])->default('Technical');

            $table->text('description')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index('status');
            $table->index('type');
            $table->index('head_id');
        });

        /*
        |--------------------------------------------------------------------------
        | Designations
        |--------------------------------------------------------------------------
        */
        Schema::create('designations', function (Blueprint $table) {
            $table->id();

            $table->string('name');
            $table->string('code')->unique();

            $table->foreignId('department_id')
                ->constrained('departments')
                ->restrictOnDelete();

            $table->enum('level', [
                'Entry',
                'Mid',
                'Senior',
                'Lead',
                'Manager',
            ])->default('Entry');

            $table->enum('status', [
                'Active',
                'Inactive',
                'Under Review',
            ])->default('Active');

            $table->text('description')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index('department_id');
            $table->index('status');
            $table->index('level');
        });

        /*
        |--------------------------------------------------------------------------
        | Employees
        |--------------------------------------------------------------------------
        */
        Schema::create('employees', function (Blueprint $table) {
            $table->id();

            /*
            |--------------------------------------------------------------------------
            | Human readable employee identifier
            | Example: HRMS001
            |--------------------------------------------------------------------------
            */
            $table->string('employee_code', 50)->unique();

            /*
            |--------------------------------------------------------------------------
            | Login account
            |--------------------------------------------------------------------------
            */
            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->string('first_name');
            $table->string('last_name');

            $table->string('email')->unique();
            $table->string('phone')->nullable();
            $table->string('alternate_phone')->nullable();

            $table->date('date_of_birth')->nullable();

            $table->enum('gender', [
                'Male',
                'Female',
                'Other',
                'Prefer not to say',
            ])->nullable();

            $table->string('marital_status')->nullable();

            /*
            |--------------------------------------------------------------------------
            | Employment
            |--------------------------------------------------------------------------
            */
            $table->enum('employment_type', [
                'Full Time',
                'Part Time',
                'Contract',
                'Intern',
                'Temporary',
            ])->nullable();

            $table->date('joining_date')->nullable();
            $table->date('probation_end_date')->nullable();

            $table->foreignId('department_id')
                ->nullable()
                ->constrained('departments')
                ->restrictOnDelete();

            $table->foreignId('designation_id')
                ->nullable()
                ->constrained('designations')
                ->restrictOnDelete();

            /*
            |--------------------------------------------------------------------------
            | These are future/reference fields.
            |--------------------------------------------------------------------------
            */
            $table->unsignedBigInteger('location_id')->nullable();
            $table->unsignedBigInteger('reporting_manager_id')->nullable();
            $table->unsignedBigInteger('employment_level_id')->nullable();

            $table->string('work_mode')->nullable();

            $table->enum('employment_status', [
                'Onboarding',
                'Active',
                'Inactive',
                'Invited',
                'On Leave',
                'Terminated'
            ])->default('Onboarding');

            $table->enum('lifecycle', [
                'Hired',
                'Employed',
                'Resigned',
                'Terminated',
                'Retired',
            ])->default('Hired');

            $table->string('profile_photo')->nullable();

            $table->text('address')->nullable();

            /*
            |--------------------------------------------------------------------------
            | Legacy/basic salary
            |--------------------------------------------------------------------------
            */
            $table->decimal('salary', 12, 2)->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index('user_id');
            $table->index('department_id');
            $table->index('designation_id');
            $table->index('employment_status');
            $table->index('employment_type');
            $table->index('work_mode');
        });

        /*
        |--------------------------------------------------------------------------
        | Employee Addresses
        |--------------------------------------------------------------------------
        */
        Schema::create('employee_addresses', function (Blueprint $table) {
            $table->id();

            $table->foreignId('employee_id')
                ->constrained('employees')
                ->cascadeOnDelete();

            $table->enum('type', [
                'current',
                'permanent',
            ]);

            $table->string('address_line_1');
            $table->string('address_line_2')->nullable();

            $table->string('city');
            $table->string('state');
            $table->string('country');
            $table->string('postal_code');

            $table->timestamps();
            $table->softDeletes();

            $table->index([
                'employee_id',
                'type',
            ]);
        });

        /*
        |--------------------------------------------------------------------------
        | Emergency Contacts
        |--------------------------------------------------------------------------
        */
        Schema::create('employee_emergency_contacts', function (Blueprint $table) {
            $table->id();

            $table->foreignId('employee_id')
                ->constrained('employees')
                ->cascadeOnDelete();

            $table->string('contact_name');
            $table->string('relationship');
            $table->string('phone');
            $table->string('alternate_phone')->nullable();
            $table->text('address')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index('employee_id');
        });

        /*
        |--------------------------------------------------------------------------
        | Employee Compensation
        |--------------------------------------------------------------------------
        */
        Schema::create('employee_compensations', function (Blueprint $table) {
            $table->id();

            $table->foreignId('employee_id')
                ->constrained('employees')
                ->cascadeOnDelete();

            $table->enum('salary_type', [
                'annual',
                'monthly',
            ]);

            $table->decimal('annual_ctc', 12, 2)->nullable();
            $table->decimal('basic_salary', 12, 2)->nullable();
            $table->decimal('hra', 12, 2)->nullable();
            $table->decimal('other_allowances', 12, 2)->nullable();
            $table->decimal('bonus', 12, 2)->nullable();

            $table->enum('pay_frequency', [
                'monthly',
                'bi_weekly',
                'weekly',
            ])->default('monthly');

            $table->date('effective_from');

            $table->timestamps();
            $table->softDeletes();

            $table->index([
                'employee_id',
                'effective_from',
            ]);
        });

        /*
        |--------------------------------------------------------------------------
        | Employee Bank Details
        |--------------------------------------------------------------------------
        */
        Schema::create('employee_bank_details', function (Blueprint $table) {
            $table->id();

            $table->foreignId('employee_id')
                ->constrained('employees')
                ->cascadeOnDelete();

            $table->string('bank_name');
            $table->string('account_holder_name');
            $table->string('account_number');

            $table->string('ifsc_code');

            $table->enum('account_type', [
                'savings',
                'current',
            ])->default('savings');

            $table->string('pan')->nullable();
            $table->string('uan')->nullable();
            $table->string('pf_number')->nullable();

            $table->boolean('is_active')->default(true);

            $table->timestamps();
            $table->softDeletes();

            $table->index('employee_id');
            $table->index('is_active');
        });

        /*
        |--------------------------------------------------------------------------
        | Employee Documents
        |--------------------------------------------------------------------------
        */
        Schema::create('employee_documents', function (Blueprint $table) {
            $table->id();

            $table->foreignId('employee_id')
                ->constrained('employees')
                ->cascadeOnDelete();

            $table->string('document_type');
            $table->string('document_number')->nullable();

            $table->string('file_path')->nullable();
            $table->string('file_name')->nullable();
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('file_size')->nullable();

            $table->enum('status', [
                'pending',
                'verified',
                'rejected',
            ])->default('pending');

            $table->foreignId('uploaded_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();

            $table->index([
                'employee_id',
                'document_type',
            ]);
        });

        /*
        |--------------------------------------------------------------------------
        | Employee Education
        |--------------------------------------------------------------------------
        */
        Schema::create('employee_education', function (Blueprint $table) {
            $table->id();

            $table->foreignId('employee_id')
                ->constrained('employees')
                ->cascadeOnDelete();

            $table->string('qualification');
            $table->string('institution');
            $table->string('university')->nullable();

            $table->decimal('percentage', 5, 2)->nullable();

            $table->year('year_of_passing')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index('employee_id');
        });

        /*
        |--------------------------------------------------------------------------
        | Employee Experience
        |--------------------------------------------------------------------------
        */
        Schema::create('employee_experiences', function (Blueprint $table) {
            $table->id();

            $table->foreignId('employee_id')
                ->constrained('employees')
                ->cascadeOnDelete();

            $table->decimal('years_of_experience', 4, 1)->nullable();

            $table->string('previous_company')->nullable();
            $table->string('job_title')->nullable();

            $table->text('languages')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index('employee_id');
        });

        /*
        |--------------------------------------------------------------------------
        | Employee Leave / Attendance Configuration
        |--------------------------------------------------------------------------
        |
        | Policy master tables are not included here because their migrations
        | have not been supplied yet.
        |
        */
        Schema::create('employee_leave_attendance', function (Blueprint $table) {
            $table->id();

            $table->foreignId('employee_id')
                ->unique()
                ->constrained('employees')
                ->cascadeOnDelete();

            $table->unsignedBigInteger('leave_policy_id')->nullable();
            $table->unsignedBigInteger('attendance_policy_id')->nullable();
            $table->unsignedBigInteger('work_schedule_id')->nullable();
            $table->unsignedBigInteger('shift_id')->nullable();
            $table->unsignedBigInteger('weekly_off_id')->nullable();
            $table->unsignedBigInteger('late_policy_id')->nullable();
            $table->unsignedBigInteger('overtime_policy_id')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index('leave_policy_id');
            $table->index('attendance_policy_id');
            $table->index('work_schedule_id');
            $table->index('shift_id');
            $table->index('weekly_off_id');
            $table->index('late_policy_id');
            $table->index('overtime_policy_id');
        });

        /*
        |--------------------------------------------------------------------------
        | Employee Onboarding
        |--------------------------------------------------------------------------
        */
        Schema::create('employee_onboarding', function (Blueprint $table) {
            $table->id();

            $table->foreignId('employee_id')
                ->unique()
                ->constrained('employees')
                ->cascadeOnDelete();

            $table->enum('onboarding_status', [
                'pending',
                'in_progress',
                'completed',
            ])->default('pending');

            $table->date('start_date')->nullable();

            $table->unsignedBigInteger('checklist_id')->nullable();

            $table->foreignId('assigned_buddy_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->text('hr_notes')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index('checklist_id');
        });

        /*
        |--------------------------------------------------------------------------
        | Employee Onboarding Drafts
        |--------------------------------------------------------------------------
        */
        Schema::create('employee_onboarding_drafts', function (Blueprint $table) {

            $table->id();

            $table->foreignId('employee_id')
                ->nullable()
                ->constrained('employees')
                ->nullOnDelete();

            $table->foreignId('created_by')
                ->constrained('users')
                ->restrictOnDelete();

            $table->foreignId('updated_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->unsignedTinyInteger('current_step')
                ->default(1);

            $table->json('completed_steps')
                ->nullable();

            $table->json('form_data')
                ->nullable();

            $table->enum('status', [
                'draft',
                'completed',
                'cancelled',
            ])->default('draft');

            $table->timestamp('last_saved_at')
                ->nullable();

            $table->timestamp('completed_at')
                ->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index([
                'created_by',
                'status',
            ]);

            $table->index('employee_id');
        });

        /*
        |--------------------------------------------------------------------------
        | Login Sessions
        |--------------------------------------------------------------------------
        */
        Schema::create('login_sessions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->string('jti', 125)->unique();

            $table->ipAddress('ip_address');
            $table->text('user_agent')->nullable();

            $table->timestamp('logged_in_at');
            $table->timestamp('logged_out_at')->nullable();
            $table->timestamp('expires_at')->nullable();

            $table->boolean('is_active')->default(true);

            $table->string('provider', 25)->default('password');

            $table->timestamps();
            $table->softDeletes();

            $table->index([
                'user_id',
                'is_active',
            ]);
        });

        /*
        |--------------------------------------------------------------------------
        | Attendance
        |--------------------------------------------------------------------------
        */
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();

            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();

            $table->date('attendance_date');

            $table->dateTime('check_in_at')->nullable();
            $table->dateTime('check_out_at')->nullable();

            $table->decimal('check_in_latitude', 10, 7)->nullable();
            $table->decimal('check_in_longitude', 10, 7)->nullable();
            $table->decimal('check_in_accuracy', 8, 2)->nullable();
            $table->unsignedInteger('check_in_distance')->nullable();

            $table->decimal('check_out_latitude', 10, 7)->nullable();
            $table->decimal('check_out_longitude', 10, 7)->nullable();
            $table->decimal('check_out_accuracy', 8, 2)->nullable();
            $table->unsignedInteger('check_out_distance')->nullable();

            $table->enum('status', [
                'Present',
                'Absent',
                'Late',
                'Half Day',
                'On Leave',
                'Holiday',
                'Week Off',
            ])->default('Present');

            $table->decimal('work_hours', 5, 2)->nullable();
            $table->decimal('overtime_hours', 5, 2)->nullable();

            $table->text('notes')->nullable();

            $table->string('source', 30)->default('mobile');
            $table->string('device_id', 255)->nullable();
            $table->ipAddress('ip_address')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->unique([
                'employee_id',
                'attendance_date',
            ]);

            $table->index('status');
            $table->index('attendance_date');
        });

        /*
        |--------------------------------------------------------------------------
        | Leave Requests
        |--------------------------------------------------------------------------
        */
        Schema::create('leave_requests', function (Blueprint $table) {
            $table->id();

            $table->foreignId('employee_id')
                ->constrained('employees')
                ->cascadeOnDelete();

            $table->string('leave_type');

            $table->date('start_date');
            $table->date('end_date');

            $table->decimal('total_days', 5, 2);

            $table->text('reason')->nullable();

            $table->enum('status', [
                'pending',
                'approved',
                'rejected',
                'cancelled',
            ])->default('pending');

            $table->foreignId('approved_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('approved_at')->nullable();

            $table->text('rejection_reason')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index([
                'employee_id',
                'status',
            ]);

            $table->index([
                'start_date',
                'end_date',
            ]);
        });

        /*
        |--------------------------------------------------------------------------
        | Payroll
        |--------------------------------------------------------------------------
        */
        Schema::create('payrolls', function (Blueprint $table) {
            $table->id();

            $table->foreignId('employee_id')
                ->constrained('employees')
                ->cascadeOnDelete();

            $table->unsignedTinyInteger('payroll_month');
            $table->unsignedSmallInteger('payroll_year');

            $table->decimal('basic_salary', 12, 2)->default(0);
            $table->decimal('gross_salary', 12, 2)->default(0);

            $table->decimal('total_deductions', 12, 2)->default(0);

            $table->decimal('net_salary', 12, 2)->default(0);

            $table->enum('status', [
                'draft',
                'processed',
                'paid',
                'cancelled',
            ])->default('draft');

            $table->timestamp('processed_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->unique([
                'employee_id',
                'payroll_month',
                'payroll_year',
            ]);

            $table->index('status');
        });

        /*
        |--------------------------------------------------------------------------
        | Notifications
        |--------------------------------------------------------------------------
        */
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->string('type');

            $table->morphs('notifiable');

            $table->text('data');

            $table->timestamp('read_at')->nullable();

            $table->timestamps();

            $table->index('read_at');
        });
    }

    public function down(): void
    {
        /*
        |--------------------------------------------------------------------------
        | Drop in reverse dependency order
        |--------------------------------------------------------------------------
        */

        Schema::dropIfExists('notifications');
        Schema::dropIfExists('payrolls');
        Schema::dropIfExists('leave_requests');
        Schema::dropIfExists('attendances');

        Schema::dropIfExists('login_sessions');

        Schema::dropIfExists('employee_onboarding_drafts');
        Schema::dropIfExists('employee_onboarding');
        Schema::dropIfExists('employee_leave_attendance');

        Schema::dropIfExists('employee_experiences');
        Schema::dropIfExists('employee_education');
        Schema::dropIfExists('employee_documents');
        Schema::dropIfExists('employee_bank_details');
        Schema::dropIfExists('employee_compensations');
        Schema::dropIfExists('employee_emergency_contacts');
        Schema::dropIfExists('employee_addresses');

        Schema::dropIfExists('employees');
        Schema::dropIfExists('designations');
        Schema::dropIfExists('departments');

        Schema::dropIfExists('employee_sequences');

        Schema::dropIfExists('role_has_permissions');
        Schema::dropIfExists('users');
        Schema::dropIfExists('permissions');
        Schema::dropIfExists('roles');
    }
};
