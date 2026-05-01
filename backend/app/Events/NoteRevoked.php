<?php

declare(strict_types=1);

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NoteRevoked implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly int $noteId,
        public readonly string $receiverId
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("user.{$this->receiverId}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'NoteRevoked';
    }

    public function broadcastWith(): array
    {
        return [
            'note_id' => $this->noteId,
            'message' => 'Quyền truy cập ghi chú của bạn đã bị thu hồi.',
        ];
    }
}
