<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class EmployeeWelcomeMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public string $temporaryPassword,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Welcome to HRMS - Your Account Details');
    }

    public function content(): Content
    {
        $loginUrl = config('app.frontend_url', 'http://localhost:3000').'/login';

        return new Content(
            view: 'emails.employee-welcome',
            with: [
                'employeeName' => $this->user->name,
                // 'email' => $this->user->email,
                'email' => 'hathimshynu@gmail.com', // Temporary email for testing
                // 'temporaryPassword' => $this->temporaryPassword,
                'temporaryPassword' => $this->temporaryPassword,
                'loginUrl' => $loginUrl,
                'role' => $this->user->role->name ?? 'Employee',
            ]
        );
    }
}
