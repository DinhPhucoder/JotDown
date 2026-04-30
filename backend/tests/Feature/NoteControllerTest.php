<?php

namespace Tests\Feature;

use App\Events\NoteUpdated;
use App\Models\Note;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class NoteControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        User::factory()->create(['id' => 1]);
    }

    public function test_get_notes_returns_empty_list_when_no_notes_exist(): void
    {
        $response = $this->getJson('/api/notes');

        $response->assertOk()->assertJson([]);
    }

    public function test_get_notes_returns_all_notes_ordered_by_pinned_and_updated_at(): void
    {
        $olderTime = Carbon::parse('2026-04-28 10:00:00');
        $newerTime = Carbon::parse('2026-04-28 11:00:00');

        $unpinnedNote = Note::factory()->create([
            'is_pinned' => false,
            'created_at' => $olderTime,
            'updated_at' => $olderTime,
        ]);

        $secondUnpinnedNote = Note::factory()->create([
            'is_pinned' => false,
            'created_at' => $newerTime,
            'updated_at' => $newerTime,
        ]);

        $pinnedNote = Note::factory()->pinned()->create([
            'is_pinned' => true,
            'created_at' => $newerTime,
            'updated_at' => $newerTime,
        ]);

        $response = $this->getJson('/api/notes');

        $response->assertOk()
            ->assertJsonCount(3)
            ->assertJsonPath('0.id', $pinnedNote->id)
            ->assertJsonPath('1.id', $secondUnpinnedNote->id)
            ->assertJsonPath('2.id', $unpinnedNote->id);
    }

    public function test_post_notes_creates_a_new_note_with_valid_data(): void
    {
        $data = [
            'title' => 'My First Note',
            'content' => 'This is a test note',
            'color' => '#ff5733',
        ];

        $response = $this->postJson('/api/notes', $data);

        $response->assertCreated()
            ->assertJsonPath('title', 'My First Note')
            ->assertJsonPath('content', 'This is a test note')
            ->assertJsonPath('color', '#ff5733')
            ->assertJsonPath('version', 1);

        $this->assertDatabaseHas('notes', $data);
    }

    public function test_post_notes_creates_a_note_with_default_color_when_not_provided(): void
    {
        $response = $this->postJson('/api/notes', [
            'title' => 'Note without color',
            'content' => 'Default white color',
        ]);

        $response->assertCreated()->assertJsonPath('color', '#ffffff');
    }

    public function test_post_notes_allows_missing_title_when_content_exists(): void
    {
        $response = $this->postJson('/api/notes', [
            'content' => 'Missing title',
        ]);

        $response->assertCreated()
            ->assertJsonPath('title', '')
            ->assertJsonPath('content', 'Missing title');
    }

    public function test_post_notes_allows_missing_content_when_title_exists(): void
    {
        $response = $this->postJson('/api/notes', [
            'title' => 'Missing content',
        ]);

        $response->assertCreated()
            ->assertJsonPath('title', 'Missing content')
            ->assertJsonPath('content', null);
    }

    public function test_post_notes_fails_validation_when_title_and_content_are_both_missing_without_attachments(): void
    {
        $response = $this->postJson('/api/notes', []);

        $response->assertUnprocessable()->assertJsonValidationErrors('note');
    }

    public function test_post_notes_allows_missing_title_and_content_when_attachments_exist(): void
    {
        $response = $this->postJson('/api/notes', [
            'attachments' => [
                [
                    'file_url' => 'https://example.com/image.jpg',
                ],
            ],
        ]);

        $response->assertCreated()
            ->assertJsonPath('title', '')
            ->assertJsonPath('content', null);
    }

    public function test_post_notes_fails_validation_when_title_exceeds_max_length(): void
    {
        $response = $this->postJson('/api/notes', [
            'title' => str_repeat('a', 256),
            'content' => 'Valid content',
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('title');
    }

    public function test_post_notes_fails_validation_when_content_exceeds_max_length(): void
    {
        $response = $this->postJson('/api/notes', [
            'title' => 'Valid title',
            'content' => str_repeat('a', 10001),
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('content');
    }

    public function test_post_notes_fails_validation_with_invalid_color_format(): void
    {
        $response = $this->postJson('/api/notes', [
            'title' => 'Valid title',
            'content' => 'Valid content',
            'color' => 'invalid-color',
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('color');
    }

    public function test_get_notes_id_returns_a_single_note_by_id(): void
    {
        $note = Note::factory()->create();

        $response = $this->getJson("/api/notes/{$note->id}");

        $response->assertOk()
            ->assertJsonPath('id', $note->id)
            ->assertJsonPath('title', $note->title)
            ->assertJsonPath('content', $note->content);
    }

    public function test_get_notes_id_returns_404_when_note_does_not_exist(): void
    {
        $response = $this->getJson('/api/notes/9999');

        $response->assertNotFound();
    }

    public function test_put_notes_id_updates_all_fields_when_provided(): void
    {
        $note = Note::factory()->create();

        $updateData = [
            'version' => $note->version,
            'title' => 'Updated Title',
            'content' => 'Updated content',
            'color' => '#00ff00',
            'is_pinned' => true,
        ];

        $response = $this->putJson("/api/notes/{$note->id}", $updateData);

        $response->assertOk()
            ->assertJsonPath('title', 'Updated Title')
            ->assertJsonPath('content', 'Updated content')
            ->assertJsonPath('color', '#00ff00')
            ->assertJsonPath('is_pinned', true)
            ->assertJsonPath('version', 2);

        $this->assertDatabaseHas('notes', [
            'id' => $note->id,
            'title' => 'Updated Title',
            'version' => 2,
        ]);
    }

    public function test_put_notes_id_updates_only_provided_fields_keeps_others_unchanged(): void
    {
        $note = Note::factory()->create(['title' => 'Original', 'content' => 'Original content']);

        $response = $this->putJson("/api/notes/{$note->id}", [
            'version' => $note->version,
            'title' => 'Updated Title Only',
        ]);

        $response->assertOk()
            ->assertJsonPath('title', 'Updated Title Only')
            ->assertJsonPath('content', 'Original content');
    }

    public function test_put_notes_id_increments_version_on_each_update(): void
    {
        $note = Note::factory()->create(['version' => 1]);

        $this->putJson("/api/notes/{$note->id}", [
            'version' => 1,
            'title' => 'Update 1',
        ]);
        $this->putJson("/api/notes/{$note->id}", [
            'version' => 2,
            'title' => 'Update 2',
        ]);

        $note->refresh();

        $this->assertEquals(3, $note->version);
    }

    public function test_put_notes_id_sets_pinned_at_to_current_time_when_is_pinned_is_true(): void
    {
        $note = Note::factory()->create(['is_pinned' => false, 'pinned_at' => null]);

        $response = $this->putJson("/api/notes/{$note->id}", [
            'version' => $note->version,
            'is_pinned' => true,
        ]);

        $response->assertOk()->assertJsonPath('is_pinned', true);

        $this->assertNotNull($note->refresh()->pinned_at);
    }

    public function test_put_notes_id_sets_pinned_at_to_null_when_is_pinned_is_false(): void
    {
        $note = Note::factory()->pinned()->create();

        $response = $this->putJson("/api/notes/{$note->id}", [
            'version' => $note->version,
            'is_pinned' => false,
        ]);

        $response->assertOk()
            ->assertJsonPath('is_pinned', false)
            ->assertJsonPath('pinned_at', null);
    }

    public function test_put_notes_id_fails_validation_with_invalid_color(): void
    {
        $note = Note::factory()->create();

        $response = $this->putJson("/api/notes/{$note->id}", [
            'version' => $note->version,
            'color' => 'not-a-hex-color',
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('color');
    }

    public function test_put_notes_id_fails_validation_when_version_is_missing(): void
    {
        $note = Note::factory()->create();

        $response = $this->putJson("/api/notes/{$note->id}", [
            'title' => 'Updated without version',
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('version');
    }

    public function test_put_notes_id_returns_conflict_when_request_version_is_stale(): void
    {
        $note = Note::factory()->create(['version' => 4]);

        $response = $this->putJson("/api/notes/{$note->id}", [
            'version' => 3,
            'title' => 'Stale update',
        ]);

        $response->assertStatus(409)
            ->assertJsonPath('conflict', true)
            ->assertJsonPath('server_version', 4)
            ->assertJsonPath('server_note.id', $note->id);
    }

    public function test_put_notes_id_broadcasts_note_updated_event(): void
    {
        Event::fake([NoteUpdated::class]);
        $note = Note::factory()->create(['version' => 1]);

        $response = $this->putJson("/api/notes/{$note->id}", [
            'version' => 1,
            'title' => 'Broadcast test',
        ]);

        $response->assertOk();

        Event::assertDispatched(NoteUpdated::class, function (NoteUpdated $event) use ($note): bool {
            return $event->note->id === $note->id;
        });
    }

    public function test_put_notes_id_returns_404_when_note_does_not_exist(): void
    {
        $response = $this->putJson('/api/notes/9999', [
            'version' => 1,
            'title' => 'New',
        ]);

        $response->assertNotFound();
    }

    public function test_delete_notes_id_soft_deletes_a_note(): void
    {
        $note = Note::factory()->create();

        $response = $this->deleteJson("/api/notes/{$note->id}");

        $response->assertOk()->assertJsonPath('message', 'Deleted successfully');

        $this->assertSoftDeleted('notes', ['id' => $note->id]);
    }

    public function test_delete_notes_id_returns_404_when_note_does_not_exist(): void
    {
        $response = $this->deleteJson('/api/notes/9999');

        $response->assertNotFound();
    }
}
