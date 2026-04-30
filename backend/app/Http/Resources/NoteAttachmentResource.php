<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NoteAttachmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'note_id' => $this->note_id,
            'file_url' => $this->file_url,
            'attachment_kind' => $this->attachment_kind,
            'original_name' => $this->original_name,
            'file_type' => $this->file_type,
            'file_size' => (int) $this->file_size,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
