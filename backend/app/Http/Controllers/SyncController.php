<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Events\NoteUpdated;
use App\Http\Requests\SyncRequest;
use App\Http\Resources\SyncResultResource;
use App\Models\Note;
use App\Models\NoteAttachment;
use App\Models\SyncQueue;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

final class SyncController extends Controller
{
    public function __construct(private readonly \App\Services\CloudinaryAttachmentService $attachmentService)
    {
    }
    public function push(SyncRequest $request): SyncResultResource
    {
        $userId = (int) ($request->user()?->id ?? 1);
        $changes = $request->validated('changes', []);
        $result = [
            'success_count' => 0,
            'failed_count' => 0,
            'conflicts' => [],
        ];

        foreach ($changes as $change) {
            $action = strtoupper((string) ($change['action'] ?? ''));
            $entityId = (int) ($change['entity_id'] ?? 0);
            $payload = is_array($change['payload'] ?? null) ? $change['payload'] : [];
            $timestamp = (string) ($change['timestamp'] ?? now()->toIso8601String());

            Log::info("Sync Push Entry", [
                'action' => $action,
                'entity_id' => $entityId,
                'version' => $payload['version'] ?? 'MISSING',
                'has_labels' => isset($payload['label_names']),
                'labels' => $payload['label_names'] ?? []
            ]);

            SyncQueue::create([
                'user_id' => $userId,
                'action' => $action,
                'entity_id' => $entityId,
                'payload' => $payload,
            ]);

            try {
                if ($action === 'CREATE') {
                    $this->applyCreate($userId, $payload, $timestamp);
                    $result['success_count']++;
                    continue;
                }

                if ($action === 'UPDATE') {
                    $conflict = $this->applyUpdate($userId, $entityId, $payload, $timestamp, (string) $userId);

                    if ($conflict !== null) {
                        $result['conflicts'][] = $conflict;
                        continue;
                    }

                    $result['success_count']++;
                    continue;
                }

                if ($action === 'DELETE') {
                    $deleted = $this->applyDelete($userId, $entityId);
                    $result[$deleted ? 'success_count' : 'failed_count']++;
                    continue;
                }

                if ($action === 'ATTACHMENT_ADD') {
                    $conflict = $this->applyAttachmentAdd($userId, $entityId, $payload, (string) $userId);

                    if ($conflict !== null) {
                        $result['conflicts'][] = $conflict;
                        continue;
                    }

                    $result['success_count']++;
                    continue;
                }

                if ($action === 'ATTACHMENT_REMOVE') {
                    $conflict = $this->applyAttachmentRemove($userId, $entityId, $payload, (string) $userId);

                    if ($conflict !== null) {
                        $result['conflicts'][] = $conflict;
                        continue;
                    }

                    $result['success_count']++;
                    continue;
                }

                $result['failed_count']++;
            } catch (Throwable $e) {
                Log::error("Sync Entry Failed", [
                    'action' => $action,
                    'entity_id' => $entityId,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
                $result['failed_count']++;
            }
        }

        return new SyncResultResource($result);
    }

    public function pull(Request $request): JsonResponse
    {
        $userId = (int) ($request->user()?->id ?? 1);
        $since = $this->resolveSince($request->query('since'));
        $changes = Note::withTrashed()
            ->with(['attachments', 'labels' => fn($q) => $q->where('labels.user_id', $userId)])
            ->where('user_id', $userId)
            ->where(function ($query) use ($since): void {
                $query->where('updated_at', '>', $since)
                    ->orWhere('deleted_at', '>', $since);
            })
            ->orderBy('updated_at')
            ->get();

        $activeNotes = $changes
            ->filter(fn (Note $note): bool => $note->deleted_at === null)
            ->values();
        $deletedIds = $changes
            ->filter(fn (Note $note): bool => $note->deleted_at !== null)
            ->pluck('id')
            ->values();

        $activeNotes->transform(function ($note) {
            return $this->maskProtectedNote($note);
        });

        return response()->json([
            'notes' => $activeNotes,
            'deleted_ids' => $deletedIds,
            'synced_at' => now()->toIso8601String(),
        ]);
    }

    private function applyCreate(int $userId, array $payload, string $timestamp): void
    {
        $parsedTime = CarbonImmutable::parse($timestamp);

        $note = Note::create([
            'user_id' => $userId,
            'title' => (string) ($payload['title'] ?? ''),
            'content' => (string) ($payload['content'] ?? ''),
            'color' => $this->resolveColor($payload['color'] ?? null),
            'is_pinned' => (bool) ($payload['is_pinned'] ?? false),
            'pinned_at' => !empty($payload['is_pinned']) ? $parsedTime : null,
            'version' => max((int) ($payload['version'] ?? 1), 1),
        ]);

        // Sync label_names nếu note mới được tạo kèm labels
        if (array_key_exists('label_names', $payload) && is_array($payload['label_names'])) {
            $this->syncNoteLabels($note, $userId, $payload['label_names']);
        }
    }

    private function applyUpdate(
        int $userId,
        int $entityId,
        array $payload,
        string $timestamp,
        string $updatedByUserId
    ): ?array {
        $note = Note::with(['attachments', 'labels'])
            ->where('id', $entityId)
            ->where('user_id', $userId)
            ->first();

        if (!$note) {
            Log::warning("Sync Update Failed: Note Not Found", ['entity_id' => $entityId, 'user_id' => $userId]);
            return [
                'entity_id' => (string) $entityId,
                'reason' => 'NOTE_NOT_FOUND',
            ];
        }

        $incomingVersion = max((int) ($payload['version'] ?? 0), 0);

        if ($incomingVersion < (int) $note->version) {
            Log::warning("Sync Update Failed: Stale Version", [
                'entity_id' => $entityId,
                'client_v' => $incomingVersion,
                'server_v' => $note->version
            ]);
            return [
                'entity_id' => (string) $entityId,
                'reason' => 'STALE_VERSION',
                'client_version' => $incomingVersion,
                'server_note' => $note->toArray(),
            ];
        }

        $incomingPinned = array_key_exists('is_pinned', $payload)
            ? (bool) $payload['is_pinned']
            : (bool) $note->is_pinned;
        $parsedTime = CarbonImmutable::parse($timestamp);

        $note->update([
            'title' => (string) ($payload['title'] ?? $note->title),
            'content' => (string) ($payload['content'] ?? $note->content),
            'color' => $this->resolveColor($payload['color'] ?? $note->color),
            'is_pinned' => $incomingPinned,
            'pinned_at' => array_key_exists('is_pinned', $payload)
                ? ($incomingPinned ? $parsedTime : null)
                : $note->pinned_at,
            'version' => ((int) $note->version) + 1,
        ]);

        // Đồng bộ label_names nếu có trong payload
        if (array_key_exists('label_names', $payload) && is_array($payload['label_names'])) {
            $this->syncNoteLabels($note, $userId, $payload['label_names']);
        }

        $note->refresh()->load('attachments', 'labels');
        event(new NoteUpdated($note, $updatedByUserId));

        return null;
    }

    /**
     * Đồng bộ labels cho note dựa trên danh sách tên.
     * Attach labels mới, detach labels bị xóa.
     */
    private function syncNoteLabels(\App\Models\Note $note, int $userId, array $labelNames): void
    {
        Log::info("Syncing labels for note {$note->id}", ['names' => $labelNames]);
        // Normalize tên
        $incomingNames = collect($labelNames)
            ->map(fn($name) => mb_strtolower(trim((string) $name)))
            ->filter()
            ->unique()
            ->values();

        // Tìm hoặc tạo labels theo tên
        $targetLabelIds = $incomingNames->map(function ($name) use ($userId) {
            $label = \App\Models\Label::firstOrCreate(
                ['user_id' => $userId, 'name' => $name],
            );
            return $label->id;
        })->filter()->values();

        Log::info("Target label IDs for note {$note->id}", ['ids' => $targetLabelIds->toArray()]);

        // Tạo mảng data cho sync với extra pivot data (user_id)
        $syncData = [];
        foreach ($targetLabelIds as $id) {
            $syncData[$id] = ['user_id' => $userId];
        }

        // Sync: chỉ giữ lại đúng danh sách targetLabelIds kèm user_id
        $note->labels()->sync($syncData);
    }

    private function applyDelete(int $userId, int $entityId): bool
    {
        $note = Note::where('id', $entityId)
            ->where('user_id', $userId)
            ->first();

        if (!$note) {
            return false;
        }

        $note->delete();
        return true;
    }

    private function applyAttachmentAdd(int $userId, int $entityId, array $payload, string $updatedByUserId): ?array
    {
        $note = Note::with('attachments')
            ->where('id', $entityId)
            ->where('user_id', $userId)
            ->first();

        if (!$note) {
            return [
                'entity_id' => (string) $entityId,
                'reason' => 'NOTE_NOT_FOUND',
            ];
        }

        $fileUrl = (string) ($payload['file_url'] ?? '');
        $fileType = strtolower(trim((string) ($payload['file_type'] ?? '')));
        $fileSize = (int) ($payload['file_size'] ?? 0);
        $originalName = isset($payload['original_name']) ? (string) $payload['original_name'] : null;

        if ($fileUrl === '' || $fileSize <= 0) {
            return [
                'entity_id' => (string) $entityId,
                'reason' => 'ATTACHMENT_INVALID_PAYLOAD',
            ];
        }

        if (!in_array($fileType, ['jpg', 'jpeg', 'png', 'image/jpeg', 'image/png'], true)) {
            return [
                'entity_id' => (string) $entityId,
                'reason' => 'ATTACHMENT_INVALID_TYPE',
            ];
        }

        if ($note->attachments()->count() >= 3) {
            return [
                'entity_id' => (string) $entityId,
                'reason' => 'ATTACHMENT_LIMIT_REACHED',
            ];
        }

        $currentTotalSize = (int) $note->attachments()->sum('file_size');
        if ($currentTotalSize + $fileSize > 15 * 1024 * 1024) {
            return [
                'entity_id' => (string) $entityId,
                'reason' => 'ATTACHMENT_TOTAL_SIZE_EXCEEDED',
            ];
        }

        NoteAttachment::create([
            'note_id' => $note->id,
            'file_url' => $fileUrl,
            'attachment_kind' => 'IMAGE',
            'original_name' => $originalName,
            'file_type' => str_contains($fileType, 'png') ? 'image/png' : 'image/jpeg',
            'file_size' => $fileSize,
        ]);

        $note->touch();
        $note->refresh()->load('attachments');
        event(new NoteUpdated($note, $updatedByUserId));

        return null;
    }

    private function applyAttachmentRemove(int $userId, int $entityId, array $payload, string $updatedByUserId): ?array
    {
        $note = Note::with('attachments')
            ->where('id', $entityId)
            ->where('user_id', $userId)
            ->first();

        if (!$note) {
            return [
                'entity_id' => (string) $entityId,
                'reason' => 'NOTE_NOT_FOUND',
            ];
        }

        $attachmentId = (int) ($payload['attachment_id'] ?? 0);
        if ($attachmentId <= 0) {
            return [
                'entity_id' => (string) $entityId,
                'reason' => 'ATTACHMENT_INVALID_PAYLOAD',
            ];
        }

        $attachment = NoteAttachment::where('id', $attachmentId)
            ->where('note_id', $note->id)
            ->first();

        if (!$attachment) {
            return [
                'entity_id' => (string) $entityId,
                'reason' => 'ATTACHMENT_NOT_FOUND',
            ];
        }

        $attachment->delete();
        $note->touch();
        $note->refresh()->load('attachments');
        event(new NoteUpdated($note, $updatedByUserId));

        return null;
    }

    private function resolveColor(mixed $color): string
    {
        if (is_string($color) && preg_match('/^#[0-9A-F]{6}$/i', $color) === 1) {
            return $color;
        }

        return '#ffffff';
    }

    private function resolveSince(mixed $rawSince): CarbonImmutable
    {
        if (!is_string($rawSince) || trim($rawSince) === '') {
            return now()->subDays(30)->toImmutable();
        }

        try {
            return CarbonImmutable::parse($rawSince);
        } catch (Throwable) {
            return now()->subDays(30)->toImmutable();
        }
    }
    private function maskProtectedNote(Note $note): Note
    {
        if ($note->is_protected) {
            $note->content = '<p>Đã khoá bằng mật mã Da Vinci. <br/>PSG vs Bayern <br/>Ars vs Aletico</p>';
            foreach ($note->attachments as $attachment) {
                $attachment->file_url = $this->attachmentService->getBlurredUrl($attachment->file_url);
            }
        }
        return $note;
    }
}
