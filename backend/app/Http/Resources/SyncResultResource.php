<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SyncResultResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'success_count' => $this->resource['success_count'] ?? 0,
            'failed_count' => $this->resource['failed_count'] ?? 0,
            'conflicts' => $this->resource['conflicts'] ?? [],
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
