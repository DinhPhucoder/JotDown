<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class VerifyEmailMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $verificationUrl
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Xác thực email — JotDown');
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.verify-email',
            with: [
                'url' => $this->verificationUrl,
            ],
        );
    }
}
