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

class NoteShared implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly Note $note,
        public readonly string $receiverId
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("user.{$this->receiverId}"),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'note' => $this->note->toArray(),
            'message' => 'Một ghi chú vừa được chia sẻ với bạn.',
        ];
    }
}
