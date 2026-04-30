<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Note;
use App\Models\NoteShare;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Validation\ValidationException;

class CloudinaryAttachmentService
{
    private const MAX_ATTACHMENTS = 3;
    private const MAX_TOTAL_BYTES = 15728640; // 15MB

    public function authorizeAttachmentAccess(Note $note, User $user): void
    {
        if ((int) $note->user_id === (int) $user->id) {
            return;
        }

        $hasEditPermission = NoteShare::query()
            ->where('note_id', $note->id)
            ->where('receiver_id', $user->id)
            ->where('permission', 'EDIT')
            ->whereNull('deleted_at')
            ->exists();

        if (! $hasEditPermission) {
            throw new AuthorizationException('Bạn không có quyền thêm ảnh vào ghi chú này.');
        }
    }

    public function buildSignaturePayload(): array
    {
        $cloudName = (string) config('cloudinary.cloud_name');
        $apiKey = (string) config('cloudinary.api_key');
        $apiSecret = (string) config('cloudinary.api_secret');
        $folder = trim((string) config('cloudinary.folder', 'note-attachments'));

        if ($cloudName === '' || $apiKey === '' || $apiSecret === '') {
            throw ValidationException::withMessages([
                'cloudinary' => ['Cloudinary chưa được cấu hình đầy đủ trên server.'],
            ]);
        }

        $timestamp = now()->timestamp;
        $paramsToSign = "folder={$folder}&timestamp={$timestamp}";
        $signature = sha1($paramsToSign.$apiSecret);

        return [
            'signature' => $signature,
            'timestamp' => $timestamp,
            'api_key' => $apiKey,
            'cloud_name' => $cloudName,
            'folder' => $folder,
            'upload_url' => "https://api.cloudinary.com/v1_1/{$cloudName}/image/upload",
        ];
    }

    public function assertAttachmentLimit(Note $note, int $incomingFileSize): void
    {
        $currentCount = $note->attachments()->count();
        if ($currentCount >= self::MAX_ATTACHMENTS) {
            throw ValidationException::withMessages([
                'file_url' => ['Mỗi ghi chú chỉ được tối đa 3 ảnh.'],
            ]);
        }

        $currentTotalSize = (int) $note->attachments()->sum('file_size');
        if ($currentTotalSize + $incomingFileSize > self::MAX_TOTAL_BYTES) {
            throw ValidationException::withMessages([
                'file_size' => ['Tổng dung lượng ảnh của ghi chú không được vượt quá 15MB.'],
            ]);
        }
    }

    public function normalizeFileType(string $fileType): string
    {
        $normalized = strtolower(trim($fileType));

        return match ($normalized) {
            'jpg', 'jpeg', 'image/jpeg' => 'image/jpeg',
            'png', 'image/png' => 'image/png',
            default => throw ValidationException::withMessages([
                'file_type' => ['Chỉ hỗ trợ ảnh định dạng JPG hoặc PNG.'],
            ]),
        };
    }

    public function assertValidCloudinaryUrl(string $url): void
    {
        $cloudName = (string) config('cloudinary.cloud_name');
        $folder = trim((string) config('cloudinary.folder', 'note-attachments'));

        $prefix = "https://res.cloudinary.com/{$cloudName}/image/upload/";
        if (! str_starts_with($url, $prefix)) {
            throw ValidationException::withMessages([
                'file_url' => ['URL ảnh không hợp lệ hoặc không thuộc Cloudinary.'],
            ]);
        }

        if ($folder !== '' && ! str_contains($url, '/'.$folder.'/')) {
            throw ValidationException::withMessages([
                'file_url' => ['Ảnh không thuộc thư mục upload được cho phép.'],
            ]);
        }
    }
}
