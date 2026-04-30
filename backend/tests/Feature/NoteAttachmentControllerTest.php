<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Note;
use App\Models\NoteAttachment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class NoteAttachmentControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'cloudinary.cloud_name' => 'demo-cloud',
            'cloudinary.api_key' => 'demo-key',
            'cloudinary.api_secret' => 'demo-secret',
            'cloudinary.folder' => 'note-attachments',
        ]);
    }

    public function test_owner_can_get_signed_payload(): void
    {
        $owner = User::factory()->create();
        $note = Note::factory()->create(['user_id' => $owner->id]);

        Sanctum::actingAs($owner);

        $response = $this->postJson("/api/v1/notes/{$note->id}/attachments/signature");

        $response->assertOk()
            ->assertJsonPath('data.cloud_name', 'demo-cloud')
            ->assertJsonPath('data.api_key', 'demo-key')
            ->assertJsonPath('data.folder', 'note-attachments');
    }

    public function test_user_with_edit_share_can_get_signature(): void
    {
        $owner = User::factory()->create();
        $collaborator = User::factory()->create();
        $note = Note::factory()->create(['user_id' => $owner->id]);

        DB::table('note_shares')->insert([
            'note_id' => $note->id,
            'sender_id' => $owner->id,
            'receiver_id' => $collaborator->id,
            'permission' => 'EDIT',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Sanctum::actingAs($collaborator);

        $this->postJson("/api/v1/notes/{$note->id}/attachments/signature")
            ->assertOk();
    }

    public function test_user_with_read_share_cannot_get_signature(): void
    {
        $owner = User::factory()->create();
        $collaborator = User::factory()->create();
        $note = Note::factory()->create(['user_id' => $owner->id]);

        DB::table('note_shares')->insert([
            'note_id' => $note->id,
            'sender_id' => $owner->id,
            'receiver_id' => $collaborator->id,
            'permission' => 'READ',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Sanctum::actingAs($collaborator);

        $this->postJson("/api/v1/notes/{$note->id}/attachments/signature")
            ->assertForbidden();
    }

    public function test_owner_can_store_attachment_with_valid_payload(): void
    {
        $owner = User::factory()->create();
        $note = Note::factory()->create(['user_id' => $owner->id]);

        Sanctum::actingAs($owner);

        $payload = [
            'file_url' => 'https://res.cloudinary.com/demo-cloud/image/upload/v123/note-attachments/test.jpg',
            'file_size' => 1024,
            'file_type' => 'image/jpeg',
            'original_name' => 'test.jpg',
        ];

        $response = $this->postJson("/api/v1/notes/{$note->id}/attachments", $payload);

        $response->assertCreated()
            ->assertJsonPath('data.note_id', $note->id)
            ->assertJsonPath('data.file_type', 'image/jpeg');

        $this->assertDatabaseHas('note_attachments', [
            'note_id' => $note->id,
            'file_url' => $payload['file_url'],
            'file_type' => 'image/jpeg',
            'file_size' => 1024,
        ]);
    }

    public function test_store_attachment_rejects_non_cloudinary_url(): void
    {
        $owner = User::factory()->create();
        $note = Note::factory()->create(['user_id' => $owner->id]);

        Sanctum::actingAs($owner);

        $this->postJson("/api/v1/notes/{$note->id}/attachments", [
            'file_url' => 'https://example.com/not-allowed.jpg',
            'file_size' => 1024,
            'file_type' => 'image/jpeg',
            'original_name' => 'test.jpg',
        ])->assertUnprocessable();
    }

    public function test_store_attachment_rejects_more_than_three_images(): void
    {
        $owner = User::factory()->create();
        $note = Note::factory()->create(['user_id' => $owner->id]);

        NoteAttachment::query()->create([
            'note_id' => $note->id,
            'file_url' => 'https://res.cloudinary.com/demo-cloud/image/upload/v1/note-attachments/1.jpg',
            'attachment_kind' => 'IMAGE',
            'file_type' => 'image/jpeg',
            'file_size' => 1024,
        ]);
        NoteAttachment::query()->create([
            'note_id' => $note->id,
            'file_url' => 'https://res.cloudinary.com/demo-cloud/image/upload/v1/note-attachments/2.jpg',
            'attachment_kind' => 'IMAGE',
            'file_type' => 'image/jpeg',
            'file_size' => 1024,
        ]);
        NoteAttachment::query()->create([
            'note_id' => $note->id,
            'file_url' => 'https://res.cloudinary.com/demo-cloud/image/upload/v1/note-attachments/3.jpg',
            'attachment_kind' => 'IMAGE',
            'file_type' => 'image/jpeg',
            'file_size' => 1024,
        ]);

        Sanctum::actingAs($owner);

        $this->postJson("/api/v1/notes/{$note->id}/attachments", [
            'file_url' => 'https://res.cloudinary.com/demo-cloud/image/upload/v1/note-attachments/4.jpg',
            'file_size' => 1024,
            'file_type' => 'image/jpeg',
            'original_name' => '4.jpg',
        ])->assertUnprocessable();
    }

    public function test_store_attachment_rejects_total_size_over_15mb(): void
    {
        $owner = User::factory()->create();
        $note = Note::factory()->create(['user_id' => $owner->id]);

        NoteAttachment::query()->create([
            'note_id' => $note->id,
            'file_url' => 'https://res.cloudinary.com/demo-cloud/image/upload/v1/note-attachments/1.jpg',
            'attachment_kind' => 'IMAGE',
            'file_type' => 'image/jpeg',
            'file_size' => 15 * 1024 * 1024,
        ]);

        Sanctum::actingAs($owner);

        $this->postJson("/api/v1/notes/{$note->id}/attachments", [
            'file_url' => 'https://res.cloudinary.com/demo-cloud/image/upload/v1/note-attachments/2.jpg',
            'file_size' => 1024,
            'file_type' => 'image/jpeg',
            'original_name' => '2.jpg',
        ])->assertUnprocessable();
    }

    public function test_store_attachment_rejects_invalid_format(): void
    {
        $owner = User::factory()->create();
        $note = Note::factory()->create(['user_id' => $owner->id]);

        Sanctum::actingAs($owner);

        $this->postJson("/api/v1/notes/{$note->id}/attachments", [
            'file_url' => 'https://res.cloudinary.com/demo-cloud/image/upload/v1/note-attachments/file.gif',
            'file_size' => 1024,
            'file_type' => 'image/gif',
            'original_name' => 'file.gif',
        ])->assertUnprocessable();
    }

    public function test_owner_can_delete_attachment(): void
    {
        $owner = User::factory()->create();
        $note = Note::factory()->create(['user_id' => $owner->id]);
        $attachment = NoteAttachment::query()->create([
            'note_id' => $note->id,
            'file_url' => 'https://res.cloudinary.com/demo-cloud/image/upload/v1/note-attachments/1.jpg',
            'attachment_kind' => 'IMAGE',
            'file_type' => 'image/jpeg',
            'file_size' => 1024,
        ]);

        Sanctum::actingAs($owner);

        $this->deleteJson("/api/v1/notes/{$note->id}/attachments/{$attachment->id}")
            ->assertOk();

        $this->assertSoftDeleted('note_attachments', [
            'id' => $attachment->id,
        ]);
    }

    public function test_attachment_delete_fails_when_attachment_not_in_note(): void
    {
        $owner = User::factory()->create();
        $note = Note::factory()->create(['user_id' => $owner->id]);
        $otherNote = Note::factory()->create(['user_id' => $owner->id]);
        $attachment = NoteAttachment::query()->create([
            'note_id' => $otherNote->id,
            'file_url' => 'https://res.cloudinary.com/demo-cloud/image/upload/v1/note-attachments/2.jpg',
            'attachment_kind' => 'IMAGE',
            'file_type' => 'image/jpeg',
            'file_size' => 1024,
        ]);

        Sanctum::actingAs($owner);

        $this->deleteJson("/api/v1/notes/{$note->id}/attachments/{$attachment->id}")
            ->assertStatus(422);
    }

    public function test_user_with_read_share_cannot_delete_attachment(): void
    {
        $owner = User::factory()->create();
        $collaborator = User::factory()->create();
        $note = Note::factory()->create(['user_id' => $owner->id]);
        $attachment = NoteAttachment::query()->create([
            'note_id' => $note->id,
            'file_url' => 'https://res.cloudinary.com/demo-cloud/image/upload/v1/note-attachments/read-only.jpg',
            'attachment_kind' => 'IMAGE',
            'file_type' => 'image/jpeg',
            'file_size' => 1024,
        ]);

        DB::table('note_shares')->insert([
            'note_id' => $note->id,
            'sender_id' => $owner->id,
            'receiver_id' => $collaborator->id,
            'permission' => 'READ',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Sanctum::actingAs($collaborator);

        $this->deleteJson("/api/v1/notes/{$note->id}/attachments/{$attachment->id}")
            ->assertForbidden();
    }
}
