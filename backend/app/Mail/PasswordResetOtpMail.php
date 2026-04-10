<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PasswordResetOtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public string $otp, public string $userName)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Password Reset OTP - Poster of the Day',
        );
    }

    public function content(): Content
    {
        return new Content(
            html: 'emails.password-reset-otp',
        );
    }
}
