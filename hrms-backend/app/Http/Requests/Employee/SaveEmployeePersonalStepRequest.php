<?php

namespace App\Http\Requests\Employee;

use App\Models\Employee;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveEmployeePersonalStepRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'first_name' => $this->input('first_name')
                ? trim($this->input('first_name'))
                : null,

            'last_name' => $this->input('last_name')
                ? trim($this->input('last_name'))
                : null,

            'email' => $this->input('email')
                ? strtolower(trim($this->input('email')))
                : null,

            'phone' => $this->normalizeIndianPhone(
                $this->input('phone')
            ),

            'alternate_phone' => $this->normalizeIndianPhone(
                $this->input('alternate_phone')
            ),
        ]);
    }

    public function rules(): array
    {
        /*
         * Find the employee already attached to this draft.
         *
         * This is important because Step 1 can be saved again.
         * We don't want the employee's own email/phone to fail
         * its own unique validation.
         */
        $employeeId = null;

        $draftId = $this->route('employeeDraft');

        if ($draftId) {
            $employeeId = \App\Models\EmployeeOnboardingDraft::where(
                'id',
                $draftId
            )->value('employee_id');
        }

        return [

            /*
            |--------------------------------------------------------------------------
            | Profile Photo
            |--------------------------------------------------------------------------
            */

            'profile_photo' => [
                'nullable',
                'string',
                'regex:/^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+\/=\r\n]+$/',
            ],

            /*
            |--------------------------------------------------------------------------
            | First Name
            |--------------------------------------------------------------------------
            */

            'first_name' => [
                'required',
                'string',
                'max:100',
            ],

            /*
            |--------------------------------------------------------------------------
            | Last Name
            |--------------------------------------------------------------------------
            */

            'last_name' => [
                'required',
                'string',
                'max:100',
            ],

            /*
            |--------------------------------------------------------------------------
            | Personal Email
            |--------------------------------------------------------------------------
            */

            'email' => [
                'required',
                'email:rfc',
                'max:255',

                Rule::unique('employees', 'email')
                    ->whereNull('deleted_at')
                    ->ignore($employeeId),
            ],

            /*
            |--------------------------------------------------------------------------
            | Primary Phone
            |--------------------------------------------------------------------------
            |
            | After prepareForValidation(), this should be:
            |
            | +919876543210
            |
            */

            'phone' => [
                'required',
                'string',

                /*
                 * International format:
                 *
                 * +919876543210
                 */
                'regex:/^\+[1-9]\d{7,14}$/',

                /*
                 * Don't allow same phone to belong
                 * to another employee.
                 */
                Rule::unique('employees', 'phone')
                    ->whereNull('deleted_at')
                    ->ignore($employeeId),
            ],

            /*
            |--------------------------------------------------------------------------
            | Alternate Phone
            |--------------------------------------------------------------------------
            */

            'alternate_phone' => [
                'nullable',
                'string',

                'regex:/^\+[1-9]\d{7,14}$/',

                Rule::unique('employees', 'alternate_phone')
                    ->whereNull('deleted_at')
                    ->ignore($employeeId),

                /*
                 * Primary and alternate phone
                 * cannot be the same.
                 */
                'different:phone',
            ],

            /*
            |--------------------------------------------------------------------------
            | Date of Birth
            |--------------------------------------------------------------------------
            */

            'date_of_birth' => [
                'nullable',
                'date',
                'before:today',
            ],

            /*
            |--------------------------------------------------------------------------
            | Gender
            |--------------------------------------------------------------------------
            */

            'gender' => [
                'nullable',
                'in:Male,Female,Other,Prefer not to say',
            ],

            /*
            |--------------------------------------------------------------------------
            | Marital Status
            |--------------------------------------------------------------------------
            */

            'marital_status' => [
                'nullable',
                'in:Single,Married,Divorced,Widowed',
            ],
        ];
    }

    /**
     * Normalize Indian phone number.
     *
     * Accepted:
     *
     * 9876543210
     * +919876543210
     * +91 9876543210
     * +91-9876543210
     *
     * Stored:
     *
     * +919876543210
     */
    protected function normalizeIndianPhone(
        ?string $phone
    ): ?string {
        if (!$phone) {
            return null;
        }

        /*
         * Remove spaces, hyphens, brackets etc.
         */
        $phone = preg_replace(
            '/[\s\-\(\)]/',
            '',
            trim($phone)
        );

        /*
         * Already +91 format.
         */
        if (str_starts_with($phone, '+91')) {

            $number = substr($phone, 3);

            return '+91' . $number;
        }

        /*
         * 919876543210
         */
        if (
            str_starts_with($phone, '91') &&
            strlen($phone) === 12
        ) {
            return '+' . $phone;
        }

        /*
         * 9876543210
         */
        if (
            strlen($phone) === 10 &&
            preg_match('/^[6-9]\d{9}$/', $phone)
        ) {
            return '+91' . $phone;
        }

        /*
         * Return original value.
         *
         * The regex validation will produce
         * the validation error.
         */
        return $phone;
    }

    public function messages(): array
    {
        return [

            'phone.required' =>
            'Phone number is required.',

            'phone.regex' =>
            'Please enter a valid Indian mobile number. Example: 9876543210 or +919876543210.',

            'phone.unique' =>
            'This phone number is already registered.',

            'alternate_phone.regex' =>
            'Please enter a valid alternate Indian mobile number.',

            'alternate_phone.unique' =>
            'This alternate phone number is already registered.',

            'alternate_phone.different' =>
            'Alternate phone number must be different from the primary phone number.',

            'email.unique' =>
            'This personal email address is already registered.',
        ];
    }
}
