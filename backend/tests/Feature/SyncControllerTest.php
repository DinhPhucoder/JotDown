<?php

namespace Tests\Feature;

use App\Models\Note;
use App\Models\NoteAttachment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SyncControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_push_sync_updates_note_when_version_is_current(): void
    {
        $user = User::factory()->create();
        $note = Note::factory()->for($user)->create(['version' => 1, 'title' => 'Old']);

        $response = $this->actingAs($user)->postJson('/api/v1/sync/push', [
            'changes' => [
                [
                    'action' => 'UPDATE',
                    'entity_id' => (string) $note->id,
                    'payload' => [
                        'title' => 'Updated',
                        'version' => 1,
                    ],
                    'timestamp' => now()->toIso8601String(),
                ],
            ],
        ]);

        $response->assertOk();
        $payload = $response->json('data') ?? $response->json();

        $this->assertSame(1, $payload['success_count']);
        $this->assertSame(0, $payload['failed_count']);
        $this->assertSame([], $payload['conflicts']);

        $this->assertDatabaseHas('notes', [
            'id' => $note->id,
            'title' => 'Updated',
            'version' => 2,
        ]);
    }

    public function test_push_sync_returns_conflict_for_stale_version(): void
    {
        $user = User::factory()->create();
        $note = Note::factory()->for($user)->create(['version' => 3, 'title' => 'Server']);

        $response = $this->actingAs($user)->postJson('/api/v1/sync/push', [
            'changes' => [
                [
                    'action' => 'UPDATE',
                    'entity_id' => (string) $note->id,
                    'payload' => [
                        'title' => 'Client stale',
                        'version' => 2,
                    ],
                    'timestamp' => now()->toIso8601String(),
                ],
            ],
        ]);

        $response->assertOk();
        $payload = $response->json('data') ?? $response->json();

        $this->assertSame(0, $payload['success_count']);
        $this->assertCount(1, $payload['conflicts']);
        $this->assertSame('STALE_VERSION', $payload['conflicts'][0]['reason']);

        $this->assertDatabaseHas('notes', [
            'id' => $note->id,
            'title' => 'Server',
            'version' => 3,
        ]);
    }

    public function test_pull_sync_returns_recent_changes(): void
    {
        $user = User::factory()->create();
        $note = Note::factory()->for($user)->create();
        $since = now()->subMinute()->toIso8601String();

        $response = $this->actingAs($user)->getJson("/api/v1/sync/pull?since={$since}");

        $response->assertOk();
        $response->assertJsonFragment([
            'id' => $note->id,
            'title' => $note->title,
        ]);
    }

    public function test_push_sync_can_add_attachment_metadata(): void
    {
        $user = User::factory()->create();
        $note = Note::factory()->for($user)->create(['version' => 1]);

        $response = $this->actingAs($user)->postJson('/api/v1/sync/push', [
            'changes' => [
                [
                    'action' => 'ATTACHMENT_ADD',
                    'entity_id' => (string) $note->id,
                    'payload' => [
                        'file_url' => 'https://res.cloudinary.com/demo-cloud/image/upload/v1/note-attachments/sync-add.jpg',
                        'file_size' => 1024,
                        'file_type' => 'image/jpeg',
                        'original_name' => 'sync-add.jpg',
                    ],
                    'timestamp' => now()->toIso8601String(),
                ],
            ],
        ]);

        $response->assertOk();
        $payload = $response->json('data') ?? $response->json();
        $this->assertSame(1, $payload['success_count']);

        $this->assertDatabaseHas('note_attachments', [
            'note_id' => $note->id,
            'file_url' => 'https://res.cloudinary.com/demo-cloud/image/upload/v1/note-attachments/sync-add.jpg',
        ]);
    }

    public function test_push_sync_can_remove_attachment_metadata(): void
    {
        $user = User::factory()->create();
        $note = Note::factory()->for($user)->create(['version' => 1]);
        $attachment = NoteAttachment::query()->create([
            'note_id' => $note->id,
            'file_url' => 'https://res.cloudinary.com/demo-cloud/image/upload/v1/note-attachments/sync-remove.jpg',
            'attachment_kind' => 'IMAGE',
            'file_type' => 'image/jpeg',
            'file_size' => 1024,
        ]);

        $response = $this->actingAs($user)->postJson('/api/v1/sync/push', [
            'changes' => [
                [
                    'action' => 'ATTACHMENT_REMOVE',
                    'entity_id' => (string) $note->id,
                    'payload' => [
                        'attachment_id' => $attachment->id,
                    ],
                    'timestamp' => now()->toIso8601String(),
                ],
            ],
        ]);

        $response->assertOk();
        $payload = $response->json('data') ?? $response->json();
        $this->assertSame(1, $payload['success_count']);
        $this->assertSoftDeleted('note_attachments', ['id' => $attachment->id]);
    }

    public function test_pull_sync_includes_attachments_snapshot(): void
    {
        $user = User::factory()->create();
        $note = Note::factory()->for($user)->create();
        $attachment = NoteAttachment::query()->create([
            'note_id' => $note->id,
            'file_url' => 'https://res.cloudinary.com/demo-cloud/image/upload/v1/note-attachments/pull.jpg',
            'attachment_kind' => 'IMAGE',
            'file_type' => 'image/jpeg',
            'file_size' => 1024,
        ]);
        $since = now()->subMinute()->toIso8601String();

        $response = $this->actingAs($user)->getJson("/api/v1/sync/pull?since={$since}");

        $response->assertOk();
        $response->assertJsonFragment([
            'id' => $attachment->id,
            'file_url' => $attachment->file_url,
        ]);
    }
}
