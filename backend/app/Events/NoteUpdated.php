<?php

declare(strict_types=1);

namespace App\Events;

use App\Models\Note;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NoteUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly Note $note,
        public readonly string $updatedByUserId
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("note.{$this->note->id}"),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'note' => $this->note->toArray(),
            'updated_by' => $this->updatedByUserId,
        ];
    }

    public function broadcastAs(): string
    {
        return 'NoteUpdated';
    }
}
