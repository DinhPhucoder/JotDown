<?php

declare(strict_types=1);

namespace App\Mail;

use App\Models\Note;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NoteSharedMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly Note $note,
        public readonly User $sender,
        public readonly string $permission,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "{$this->sender->name} đã chia sẻ một ghi chú với bạn",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.notes.shared',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
