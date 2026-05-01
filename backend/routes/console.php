<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('cloudinary:cleanup-orphans {--dry-run} {--older-than-days=7}', function () {
    $cloudName = (string) config('cloudinary.cloud_name');
    $apiKey = (string) config('cloudinary.api_key');
    $apiSecret = (string) config('cloudinary.api_secret');
    $folder = trim((string) config('cloudinary.folder', 'note-attachments'));

    if ($cloudName === '' || $apiKey === '' || $apiSecret === '') {
        $this->error('Cloudinary is not configured (missing CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET).');
        return 1;
    }

    $olderThanDays = (int) $this->option('older-than-days');
    $olderThanDays = $olderThanDays > 0 ? $olderThanDays : 7;
    $threshold = now()->subDays($olderThanDays);
    $isDryRun = (bool) $this->option('dry-run');

    $referencedPublicIds = DB::table('note_attachments')
        ->whereNull('deleted_at')
        ->pluck('file_url')
        ->filter()
        ->map(function (string $url) use ($cloudName): ?string {
            $prefix = "https://res.cloudinary.com/{$cloudName}/image/upload/";
            if (! str_starts_with($url, $prefix)) {
                return null;
            }

            $path = substr($url, strlen($prefix));
            $path = preg_replace('#^v\\d+/#', '', $path) ?? $path;
            $path = preg_replace('#\\.[a-zA-Z0-9]+$#', '', $path) ?? $path;
            $path = trim($path, '/');

            return $path !== '' ? $path : null;
        })
        ->filter()
        ->unique()
        ->values()
        ->all();

    $referencedSet = array_fill_keys($referencedPublicIds, true);

    $nextCursor = null;
    $deleted = 0;
    $checked = 0;

    do {
        $response = Http::withBasicAuth($apiKey, $apiSecret)
            ->acceptJson()
            ->get("https://api.cloudinary.com/v1_1/{$cloudName}/resources/image/upload", array_filter([
                'prefix' => $folder !== '' ? "{$folder}/" : null,
                'max_results' => 500,
                'next_cursor' => $nextCursor,
            ]));

        if (! $response->successful()) {
            $this->error('Failed to list Cloudinary resources: '.$response->body());
            return 1;
        }

        $payload = $response->json();
        $resources = is_array($payload['resources'] ?? null) ? $payload['resources'] : [];

        foreach ($resources as $resource) {
            $publicId = (string) ($resource['public_id'] ?? '');
            $createdAt = $resource['created_at'] ?? null;
            $created = $createdAt ? \Illuminate\Support\Carbon::parse($createdAt) : null;

            if ($publicId === '' || ! $created) {
                continue;
            }

            $checked++;

            if ($created->greaterThan($threshold)) {
                continue;
            }

            if (isset($referencedSet[$publicId])) {
                continue;
            }

            if ($isDryRun) {
                $this->line("DRY-RUN delete: {$publicId} ({$created->toDateTimeString()})");
                continue;
            }

            $deleteResponse = Http::withBasicAuth($apiKey, $apiSecret)
                ->acceptJson()
                ->delete("https://api.cloudinary.com/v1_1/{$cloudName}/resources/image/upload/{$publicId}");

            if ($deleteResponse->successful()) {
                $deleted++;
                $this->line("Deleted: {$publicId}");
                continue;
            }

            $this->warn("Failed to delete {$publicId}: ".$deleteResponse->body());
        }

        $nextCursor = $payload['next_cursor'] ?? null;
    } while (is_string($nextCursor) && $nextCursor !== '');

    $this->info("Checked: {$checked}. Deleted: {$deleted}.");
    return 0;
})->purpose('Delete orphaned Cloudinary files not referenced by note_attachments');

Artisan::command('db:cleanup {--days=3}', function () {
    $days = (int) $this->option('days');
    $threshold = now()->subDays($days);

    $this->info("Đang dọn dẹp các bản ghi cũ hơn {$days} ngày...");

    // 1. Xóa vĩnh viễn các bản ghi Soft Delete
    $notesCount = \App\Models\Note::onlyTrashed()->where('deleted_at', '<', $threshold)->forceDelete();
    $sharesCount = \App\Models\NoteShare::onlyTrashed()->where('deleted_at', '<', $threshold)->forceDelete();
    $attachmentsCount = \App\Models\NoteAttachment::onlyTrashed()->where('deleted_at', '<', $threshold)->forceDelete();

    // 2. Dọn dẹp Sync Queue (Audit logs)
    $syncCount = DB::table('sync_queue')->where('created_at', '<', $threshold)->delete();

    // 3. Dọn dẹp Sessions hết hạn (Laravel lưu last_activity là timestamp)
    $sessionsCount = 0;
    if (config('session.driver') === 'database') {
        $sessionsCount = DB::table('sessions')
            ->where('last_activity', '<', $threshold->getTimestamp())
            ->delete();
    }

    $this->line("- Ghi chú (SoftDeleted): {$notesCount}");
    $this->line("- Quyền chia sẻ (SoftDeleted): {$sharesCount}");
    $this->line("- File đính kèm (SoftDeleted): {$attachmentsCount}");
    $this->line("- Lịch sử đồng bộ (Sync Queue): {$syncCount}");
    $this->line("- Phiên làm việc cũ (Sessions): {$sessionsCount}");
    
    $this->info('Đã hoàn thành dọn dẹp hệ thống.');
})->purpose('Dọn dẹp định kỳ các dữ liệu rác, phiên làm việc cũ và lịch sử đồng bộ');

