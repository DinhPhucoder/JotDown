<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $otp,
        public string $purpose = 'verify'
    ) {}

    public function envelope(): Envelope
    {
        $subject = match ($this->purpose) {
            'verify' => 'Xác thực email — JotDown',
            'reset' => 'Đặt lại mật khẩu — JotDown',
            default => 'Mã OTP — JotDown',
        };

        return new Envelope(subject: $subject);
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.otp',
            with: [
                'otp' => $this->otp,
                'purpose' => $this->purpose,
            ],
        );
    }
}
