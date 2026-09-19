<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DepartmentController;
use App\Http\Controllers\Api\DesignationController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\EmployeeDraftController;
use App\Http\Controllers\Api\EmployeeProfilePhotoController;
use App\Http\Controllers\Api\MenuController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\EmployeeMasterController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\AttendanceRegularizationController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\PermissionController;



use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Authentication Routes
|--------------------------------------------------------------------------
*/

Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:login')
    ->name('auth.login');

Route::post('/google-login', [AuthController::class, 'googleLogin'])
    ->middleware('throttle:login')
    ->name('auth.google-login');


/*
|--------------------------------------------------------------------------
| Refresh Token
|--------------------------------------------------------------------------
|
| Refresh does NOT use auth:api or jwt.current because the existing
| access token may already be expired. The jwt.cookie middleware
| extracts the token from the HttpOnly cookie.
|
*/

Route::middleware('jwt.cookie')->group(function () {
    Route::post('/refresh', [AuthController::class, 'refresh'])
        ->name('auth.refresh');
});


/*
|--------------------------------------------------------------------------
| Authenticated Routes
|--------------------------------------------------------------------------
|
| jwt.cookie MUST execute before auth:api.
| This ordering is enforced in bootstrap/app.php.
|
*/

Route::middleware([
    'jwt.cookie',
    'auth:api',
    'jwt.current',
])->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Authentication
    |--------------------------------------------------------------------------
    */

    Route::get('/me', [AuthController::class, 'me'])
        ->name('auth.me');

    Route::post('/logout', [AuthController::class, 'logout'])
        ->name('auth.logout');

    Route::post('/change-password', [AuthController::class, 'changePassword'])
        ->name('auth.change-password');


    /*
    |--------------------------------------------------------------------------
    | Menus
    |--------------------------------------------------------------------------
    */

    Route::get('/menus', [MenuController::class, 'index']);


    /*
    |--------------------------------------------------------------------------
    | Password Changed Required
    |--------------------------------------------------------------------------
    |
    | Users with must_change_password = true cannot access the
    | following APIs until they change their password.
    |
    */

    Route::middleware('password.changed')->group(function () {

        /*
        |--------------------------------------------------------------------------
        | Dashboard
        |--------------------------------------------------------------------------
        */

        Route::get('/dashboard', function () {
            return response()->json([
                'success' => true,
                'data' => [
                    'total_employees' => 22,
                    'active_employees' => 17,
                    'present_today' => 22,
                    'employees_on_leave' => 3,
                    'pending_leave_requests' => 2,
                    'payroll_processed' => 14,
                    'payroll_total' => 20,
                ],
            ]);
        })->middleware('permission:view dashboard');


        /*
        |--------------------------------------------------------------------------
        | Employees
        |--------------------------------------------------------------------------
        */

        Route::get('/employees', [EmployeeController::class, 'index'])
            ->middleware('permission:view employees');

        Route::post('/employees', [EmployeeController::class, 'store'])
            ->middleware('permission:create employees');

        Route::get('/employees/{employee}', [EmployeeController::class, 'show'])
            ->middleware('permission:view employee details');

        Route::put('/employees/{employee}', [EmployeeController::class, 'update'])
            ->middleware('permission:edit employees');

        Route::patch('/employees/{employee}', [EmployeeController::class, 'update'])
            ->middleware('permission:edit employees');

        Route::delete('/employees/{employee}', [EmployeeController::class, 'destroy'])
            ->middleware('permission:delete employees');


        /*
        |--------------------------------------------------------------------------
        | Employee onboarding Drafts
        |--------------------------------------------------------------------------
        */

        Route::prefix('employee-onboarding')->group(function () {
            Route::post('/start', [EmployeeDraftController::class, 'store'])->middleware('permission:create employee drafts')->name('employee-onboarding.start');

            Route::get('/drafts', [EmployeeDraftController::class, 'index'])->middleware('permission:view employee drafts');

            Route::get('/drafts/{employeeDraft}', [EmployeeDraftController::class, 'show'])->middleware('permission:view employee drafts');

            Route::post('/steps/{step}', [EmployeeDraftController::class, 'updateStep'])->middleware('permission:edit employee drafts');

            Route::post('/complete', [EmployeeDraftController::class, 'complete'])->middleware('permission:complete employee onboarding');

            Route::delete('/drafts/{employeeDraft}', [EmployeeDraftController::class, 'destroy'])->middleware('permission:delete employee drafts');
        });

        /*
        |--------------------------------------------------------------------------
        | Employee Masters
        |--------------------------------------------------------------------------
        */
        Route::prefix('employee-masters')->group(function () {
            Route::get('/step-two', [EmployeeMasterController::class, 'stepTwoMasters'])->middleware('permission:create employee drafts');

            Route::get('/branches', [EmployeeMasterController::class, 'branches'])->middleware('permission:create employee drafts');
            Route::get('/locations', [EmployeeMasterController::class, 'locations'])->middleware('permission:create employee drafts');
            Route::get('/reporting-managers', [EmployeeMasterController::class, 'reportingManagers'])->middleware('permission:create employee drafts');

            Route::get('/departments/{department}/designations', [EmployeeMasterController::class, 'designationsByDepartment'])->middleware('permission:create employee drafts');

            Route::get('/leave-policies', [EmployeeMasterController::class, 'leavePolicies'])->middleware('permission:create employee drafts');
            Route::post('/leave-policies', [EmployeeMasterController::class, 'createLeavePolicy'])->middleware('permission:create leave policies');
            Route::put('/leave-policies/{leavePolicy}', [EmployeeMasterController::class, 'updateLeavePolicy'])->middleware('permission:edit leave policies');
            Route::delete('/leave-policies/{leavePolicy}', [EmployeeMasterController::class, 'deleteLeavePolicy'])->middleware('permission:delete leave policies');

            Route::get('/attendance-policies', [EmployeeMasterController::class, 'attendancePolicies'])->middleware('permission:create employee drafts');
            Route::post('/attendance-policies', [EmployeeMasterController::class, 'createAttendancePolicy'])->middleware('permission:create attendance policies');
            Route::put('/attendance-policies/{attendancePolicy}', [EmployeeMasterController::class, 'updateAttendancePolicy'])->middleware('permission:edit attendance policies');
            Route::delete('/attendance-policies/{attendancePolicy}', [EmployeeMasterController::class, 'deleteAttendancePolicy'])->middleware('permission:delete attendance policies');

            Route::get('/work-schedules', [EmployeeMasterController::class, 'workSchedules'])->middleware('permission:create employee drafts');
            Route::post('/work-schedules', [EmployeeMasterController::class, 'createWorkSchedule'])->middleware('permission:create work schedules');
            Route::put('/work-schedules/{workSchedule}', [EmployeeMasterController::class, 'updateWorkSchedule'])->middleware('permission:edit work schedules');
            Route::delete('/work-schedules/{workSchedule}', [EmployeeMasterController::class, 'deleteWorkSchedule'])->middleware('permission:delete work schedules');

            Route::get('/shifts', [EmployeeMasterController::class, 'shifts'])->middleware('permission:create employee drafts');
            Route::post('/shifts', [EmployeeMasterController::class, 'createShift'])->middleware('permission:create shifts');
            Route::put('/shifts/{shift}', [EmployeeMasterController::class, 'updateShift'])->middleware('permission:edit shifts');
            Route::delete('/shifts/{shift}', [EmployeeMasterController::class, 'deleteShift'])->middleware('permission:delete shifts');

            Route::get('/weekly-offs', [EmployeeMasterController::class, 'weeklyOffs'])->middleware('permission:create employee drafts');
            Route::post('/weekly-offs', [EmployeeMasterController::class, 'createWeeklyOff'])->middleware('permission:create weekly offs');
            Route::put('/weekly-offs/{weeklyOff}', [EmployeeMasterController::class, 'updateWeeklyOff'])->middleware('permission:edit weekly offs');
            Route::delete('/weekly-offs/{weeklyOff}', [EmployeeMasterController::class, 'deleteWeeklyOff'])->middleware('permission:delete weekly offs');

            Route::get('/late-policies', [EmployeeMasterController::class, 'latePolicies'])->middleware('permission:create employee drafts');
            Route::post('/late-policies', [EmployeeMasterController::class, 'createLatePolicy'])->middleware('permission:create late policies');
            Route::put('/late-policies/{latePolicy}', [EmployeeMasterController::class, 'updateLatePolicy'])->middleware('permission:edit late policies');
            Route::delete('/late-policies/{latePolicy}', [EmployeeMasterController::class, 'deleteLatePolicy'])->middleware('permission:delete late policies');

            Route::get('/overtime-policies', [EmployeeMasterController::class, 'overtimePolicies'])->middleware('permission:create employee drafts');
            Route::post('/overtime-policies', [EmployeeMasterController::class, 'createOvertimePolicy'])->middleware('permission:create overtime policies');
            Route::put('/overtime-policies/{overtimePolicy}', [EmployeeMasterController::class, 'updateOvertimePolicy'])->middleware('permission:edit overtime policies');
            Route::delete('/overtime-policies/{overtimePolicy}', [EmployeeMasterController::class, 'deleteOvertimePolicy'])->middleware('permission:delete overtime policies');

            Route::get('/onboarding-checklists', [EmployeeMasterController::class, 'onboardingChecklists'])->middleware('permission:create employee drafts');
            Route::post('/onboarding-checklists', [EmployeeMasterController::class, 'createOnboardingChecklist'])->middleware('permission:create onboarding checklists');
            Route::put('/onboarding-checklists/{onboardingChecklist}', [EmployeeMasterController::class, 'updateOnboardingChecklist'])->middleware('permission:edit onboarding checklists');
            Route::delete('/onboarding-checklists/{onboardingChecklist}', [EmployeeMasterController::class, 'deleteOnboardingChecklist'])->middleware('permission:delete onboarding checklists');
        });


        /*
        |--------------------------------------------------------------------------
        | Departments
        |--------------------------------------------------------------------------
        */

        Route::get('/departments', [DepartmentController::class, 'index'])
            ->middleware('permission:view departments');

        Route::post('/departments', [DepartmentController::class, 'store'])
            ->middleware('permission:create departments');

        Route::get('/departments/{department}', [DepartmentController::class, 'show'])
            ->middleware('permission:view departments');

        Route::put('/departments/{department}', [DepartmentController::class, 'update'])
            ->middleware('permission:edit departments');

        Route::patch('/departments/{department}', [DepartmentController::class, 'update'])
            ->middleware('permission:edit departments');

        Route::delete('/departments/{department}', [DepartmentController::class, 'destroy'])
            ->middleware('permission:delete departments');

        /*
        |--------------------------------------------------------------------------
        | Designations
        |--------------------------------------------------------------------------
        */

        Route::get('/designations', [DesignationController::class, 'index'])
            ->middleware('permission:view designations');

        Route::post('/designations', [DesignationController::class, 'store'])
            ->middleware('permission:create designations');

        Route::get('/designations/{designation}', [DesignationController::class, 'show'])
            ->middleware('permission:view designations');

        Route::put('/designations/{designation}', [DesignationController::class, 'update'])
            ->middleware('permission:edit designations');

        Route::patch('/designations/{designation}', [DesignationController::class, 'update'])
            ->middleware('permission:edit designations');

        Route::delete('/designations/{designation}', [DesignationController::class, 'destroy'])
            ->middleware('permission:delete designations');


        /*
        |--------------------------------------------------------------------------
        | Users
        |--------------------------------------------------------------------------
        */

        Route::get('/users', [UserController::class, 'index'])
            ->middleware('permission:view users');

        Route::post('/users', [UserController::class, 'store'])
            ->middleware('permission:create users');

        Route::get('/users/{user}', [UserController::class, 'show'])
            ->middleware('permission:view users');

        Route::put('/users/{user}', [UserController::class, 'update'])
            ->middleware('permission:edit users');

        Route::patch('/users/{user}', [UserController::class, 'update'])
            ->middleware('permission:edit users');

        Route::delete('/users/{user}', [UserController::class, 'destroy'])
            ->middleware('permission:delete users');


        /*
        |--------------------------------------------------------------------------
        | Settings
        |--------------------------------------------------------------------------
        */

        Route::get('/settings', function () {
            return response()->json([
                'success' => true,
                'data' => [
                    'full_name' => 'Jane Doe',
                    'email' => 'jane.doe@workforce.com',
                    'department' => 'Human Resources',
                    'role' => 'HR Administrator',
                ],
            ]);
        });

        /*
        |--------------------------------------------------------------------------
        | Employee Profile Photo
        |--------------------------------------------------------------------------
        */

        Route::get('/employees/{employee}/profile-photo', [
            EmployeeProfilePhotoController::class,
            'show',
        ])->name('employees.profile-photo')->middleware('permission:view employee details');


        /*
|--------------------------------------------------------------------------
| Attendance
|--------------------------------------------------------------------------
*/

        Route::prefix('attendance')->group(function () {

            /*
    |--------------------------------------------------------------------------
    | Mobile Attendance
    |--------------------------------------------------------------------------
    */

            Route::get('/today', [AttendanceController::class, 'today'])
                ->middleware('permission:view attendance')
                ->name('attendance.today');

            Route::post('/check-in', [AttendanceController::class, 'checkIn'])
                ->middleware('permission:view attendance')
                ->name('attendance.check-in');

            Route::post('/check-out', [AttendanceController::class, 'checkOut'])
                ->middleware('permission:view attendance')
                ->name('attendance.check-out');

            Route::get('/history', [AttendanceController::class, 'history'])
                ->middleware('permission:view attendance')
                ->name('attendance.history');

            Route::get('/calendar', [AttendanceController::class, 'calendar'])
                ->middleware('permission:view attendance')
                ->name('attendance.calendar');

            Route::get('/timesheet', [AttendanceController::class, 'timesheet'])
                ->middleware('permission:view attendance')
                ->name('attendance.timesheet');


            /*
    |--------------------------------------------------------------------------
    | Employee Regularization
    |--------------------------------------------------------------------------
    */

            Route::post('/regularizations', [AttendanceRegularizationController::class, 'store'])
                ->middleware('permission:view attendance')
                ->name('attendance.regularizations.store');

            Route::get('/regularizations', [AttendanceRegularizationController::class, 'index'])
                ->middleware('permission:view attendance')
                ->name('attendance.regularizations.index');

            Route::get('/regularizations/{attendanceRegularization}', [AttendanceRegularizationController::class, 'show'])
                ->middleware('permission:view attendance')
                ->name('attendance.regularizations.show');

            Route::put('/regularizations/{attendanceRegularization}/cancel', [AttendanceRegularizationController::class, 'cancel'])
                ->middleware('permission:view attendance')
                ->name('attendance.regularizations.cancel');


            /*
    |--------------------------------------------------------------------------
    | HR / Admin Regularization
    |--------------------------------------------------------------------------
    */

            Route::get('/admin/regularizations', [AttendanceRegularizationController::class, 'adminIndex'])
                ->middleware('permission:view attendance')
                ->name('attendance.admin.regularizations');

            Route::put('/admin/regularizations/{attendanceRegularization}/approve', [AttendanceRegularizationController::class, 'approve'])
                ->middleware('permission:edit attendance')
                ->name('attendance.regularizations.approve');

            Route::put('/admin/regularizations/{attendanceRegularization}/reject', [AttendanceRegularizationController::class, 'reject'])
                ->middleware('permission:edit attendance')
                ->name('attendance.regularizations.reject');


            /*
    |--------------------------------------------------------------------------
    | HR / Admin Attendance
    |--------------------------------------------------------------------------
    |
    | These expose EVERY employee's attendance (org-wide list, summary,
    | per-employee history, single-record lookup by id with no ownership
    | check). They previously shared `permission:view attendance` with the
    | self-service routes above, so any authenticated employee with the
    | ordinary "view attendance" permission (i.e. every employee - see the
    | Employee role) could enumerate other employees' attendance - an IDOR/
    | broken access control bug. Gated behind `edit attendance` instead,
    | matching this module's own existing convention that HR/admin actions
    | (approve/reject regularization) already require `edit attendance`
    | while self-service uses `view attendance`. No new permission invented.
    |
    */

            Route::get('/', [AttendanceController::class, 'index'])
                ->middleware('permission:edit attendance')
                ->name('attendance.index');

            Route::get('/summary', [AttendanceController::class, 'summary'])
                ->middleware('permission:edit attendance')
                ->name('attendance.summary');

            Route::get('/employee/{employee}', [AttendanceController::class, 'employeeAttendance'])
                ->middleware('permission:edit attendance')
                ->name('attendance.employee');

            Route::get('/{attendance}', [AttendanceController::class, 'show'])
                ->middleware('permission:edit attendance')
                ->name('attendance.show');
        });
        /*
    |--------------------------------------------------------------------------
    | Roles and Permissions
    |--------------------------------------------------------------------------
    */

        Route::prefix('roles')->middleware('permission:manage roles')->group(function () {
            Route::get('/', [RoleController::class, 'index'])->name('roles.index');
            Route::post('/', [RoleController::class, 'store'])->name('roles.store');
            Route::get('/{role}/permissions', [RoleController::class, 'permissions'])->name('roles.permissions');
            Route::put('/{role}/permissions', [RoleController::class, 'syncPermissions'])->name('roles.permissions.sync');
            Route::post('/{role}/permissions/{permission}', [RoleController::class, 'attachPermission'])->name('roles.permissions.attach');
            Route::delete('/{role}/permissions/{permission}', [RoleController::class, 'detachPermission'])->name('roles.permissions.detach');
            Route::get('/{role}', [RoleController::class, 'show'])->name('roles.show');
            Route::put('/{role}', [RoleController::class, 'update'])->name('roles.update');
            Route::patch('/{role}', [RoleController::class, 'update'])->name('roles.patch');
            Route::delete('/{role}', [RoleController::class, 'destroy'])->name('roles.destroy');
        });

        Route::prefix('permissions')->middleware('permission:manage permissions')->group(function () {
            Route::get('/', [PermissionController::class, 'index'])->name('permissions.index');
            Route::post('/', [PermissionController::class, 'store'])->name('permissions.store');
            Route::get('/grouped', [PermissionController::class, 'grouped'])->name('permissions.grouped');
            Route::get('/modules', [PermissionController::class, 'modules'])->name('permissions.modules');
            Route::get('/{permission}', [PermissionController::class, 'show'])->name('permissions.show');
            Route::put('/{permission}', [PermissionController::class, 'update'])->name('permissions.update');
            Route::patch('/{permission}', [PermissionController::class, 'update'])->name('permissions.patch');
            Route::delete('/{permission}', [PermissionController::class, 'destroy'])->name('permissions.destroy');
        });
    }); //password.changed middleware group
});
