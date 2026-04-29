<?php

namespace Tests\Unit;

use App\Mail\NoteSharedMail;
use App\Models\Note;
use App\Models\User;
use Tests\TestCase;

class MailTest extends TestCase
{
    public function test_builds_note_shared_mail_correctly()
    {
        $note = new Note();
        $note->id = 1;
        $note->title = 'Test Note';
        
        $sender = new User();
        $sender->name = 'Sender User';
        
        $mail = new NoteSharedMail($note, $sender, 'read');
        
        $this->assertEquals('Sender User đã chia sẻ một ghi chú với bạn', $mail->envelope()->subject);
        $this->assertEquals('emails.notes.shared', $mail->content()->view);
    }
}
