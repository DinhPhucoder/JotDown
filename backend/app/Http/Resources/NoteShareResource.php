<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NoteShareResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'note_id'    => $this->note_id,
            'sender_id'  => $this->sender_id,
            'sender'     => $this->whenLoaded('sender', fn () => [
                'id'    => $this->sender->id,
                'name'  => $this->sender->name,
                'email' => $this->sender->email,
            ]),
            'receiver'   => $this->whenLoaded('receiver', fn () => [
                'id'    => $this->receiver->id,
                'name'  => $this->receiver->name,
                'email' => $this->receiver->email,
            ]),
            'note'       => $this->whenLoaded('note', fn () => $this->note->toArray()),
            'permission' => $this->permission,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
