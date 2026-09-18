<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to HRMS HRMS</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
        <h1 style="color: #007bff; margin: 0;">HRMS HRMS</h1>
    </div>

    <h2 style="color: #333;">Hello {{ $employeeName }},</h2>

    <p>Welcome to <strong>HRMS</strong>.</p>

    <p>Your HRMS account has been successfully created.</p>

    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #007bff;">Your Account Details</h3>

        <p><strong>Login URL:</strong><br>
        <a href="{{ $loginUrl }}" style="color: #007bff;">{{ $loginUrl }}</a></p>

        <p><strong>Email:</strong><br>
        {{ $email }}</p>

        <p><strong>Temporary Password:</strong><br>
        <code style="background-color: #e9ecef; padding: 5px 10px; border-radius: 5px; font-size: 14px;">{{ $temporaryPassword }}</code></p>

        <p><strong>Role:</strong><br>
        {{ $role }}</p>
    </div>

    <div style="background-color: #fff3cd; padding: 15px; border-radius: 10px; border-left: 4px solid #ffc107; margin: 20px 0;">
        <p style="margin: 0;"><strong>⚠️ Important Security Notice</strong></p>
        <p style="margin: 10px 0 0 0;">For security reasons, you must change your password after your first login.</p>
    </div>

    <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">

    <p style="color: #6c757d; font-size: 14px;">
        Regards,<br>
        <strong>HR Team</strong><br>
        HRMS
    </p>
</body>
</html>
