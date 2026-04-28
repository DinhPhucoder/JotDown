<?php

namespace Tests\Unit;

use App\Events\NoteShared;
use App\Events\NoteUpdated;
use App\Events\UserJoinedNote;
use App\Models\Note;
use App\Models\User;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Broadcasting\PresenceChannel;
use Tests\TestCase;

class EventsTest extends TestCase
{
    public function test_builds_note_updated_event_correctly()
    {
        $note = new Note();
        $note->id = 10;
        $event = new NoteUpdated($note, 'user-1');
        
        $channels = $event->broadcastOn();
        $this->assertInstanceOf(PrivateChannel::class, $channels[0]);
        $this->assertEquals('private-note.10', $channels[0]->name);
        
        $data = $event->broadcastWith();
        $this->assertArrayHasKey('note', $data);
        $this->assertArrayHasKey('updated_by', $data);
    }

    public function test_builds_user_joined_note_event_correctly()
    {
        $note = new Note();
        $note->id = 10;
        $user = new User();
        $user->id = 1;
        $user->name = 'Test';
        $event = new UserJoinedNote($note, $user);
        
        $channels = $event->broadcastOn();
        $this->assertInstanceOf(PresenceChannel::class, $channels[0]);
        $this->assertEquals('presence-note.10', $channels[0]->name);
        
        $data = $event->broadcastWith();
        $this->assertEquals('Test', $data['user']['name']);
    }

    public function test_builds_note_shared_event_correctly()
    {
        $note = new Note();
        $note->id = 10;
        $note->title = 'Test';
        $event = new NoteShared($note, '20');
        
        $channels = $event->broadcastOn();
        $this->assertInstanceOf(PrivateChannel::class, $channels[0]);
        $this->assertEquals('private-user.20', $channels[0]->name);
        
        $data = $event->broadcastWith();
        $this->assertArrayHasKey('message', $data);
    }
}
