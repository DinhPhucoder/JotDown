<?php

namespace Tests\Feature;

use App\Models\Label;
use App\Models\Note;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NoteLabelsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        User::factory()->create(['id' => 1]);
    }

    public function test_post_notes_note_labels_attach_attaches_labels_to_a_note(): void
    {
        $note = Note::factory()->create();
        $labels = Label::factory(3)->create();

        $response = $this->postJson("/api/notes/{$note->id}/labels/attach", [
            'label_ids' => $labels->pluck('id')->toArray(),
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'Labels attached successfully')
            ->assertJsonCount(3, 'data.labels');

        $this->assertEquals(3, $note->labels()->count());
    }

    public function test_post_notes_note_labels_attach_attaches_a_single_label_to_a_note(): void
    {
        $note = Note::factory()->create();
        $label = Label::factory()->create();

        $response = $this->postJson("/api/notes/{$note->id}/labels/attach", [
            'label_ids' => [$label->id],
        ]);

        $response->assertOk()->assertJsonCount(1, 'data.labels');

        $this->assertTrue($note->labels()->where('id', $label->id)->exists());
    }

    public function test_post_notes_note_labels_attach_attaches_without_detaching_existing_labels(): void
    {
        $note = Note::factory()->create();
        $existingLabel = Label::factory()->create();
        $newLabels = Label::factory(2)->create();

        $note->labels()->attach($existingLabel->id);

        $response = $this->postJson("/api/notes/{$note->id}/labels/attach", [
            'label_ids' => $newLabels->pluck('id')->toArray(),
        ]);

        $response->assertOk()->assertJsonCount(3, 'data.labels');

        $this->assertEquals(3, $note->labels()->count());
    }

    public function test_post_notes_note_labels_attach_fails_validation_when_label_ids_is_missing(): void
    {
        $note = Note::factory()->create();

        $response = $this->postJson("/api/notes/{$note->id}/labels/attach", []);

        $response->assertUnprocessable()->assertJsonValidationErrors('label_ids');
    }

    public function test_post_notes_note_labels_attach_fails_validation_when_label_ids_is_empty_array(): void
    {
        $note = Note::factory()->create();

        $response = $this->postJson("/api/notes/{$note->id}/labels/attach", [
            'label_ids' => [],
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('label_ids');
    }

    public function test_post_notes_note_labels_attach_fails_validation_when_label_ids_contains_nonexistent_label(): void
    {
        $note = Note::factory()->create();

        $response = $this->postJson("/api/notes/{$note->id}/labels/attach", [
            'label_ids' => [9999],
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('label_ids.0');
    }

    public function test_post_notes_note_labels_attach_returns_404_when_note_does_not_exist(): void
    {
        $label = Label::factory()->create();

        $response = $this->postJson('/api/notes/9999/labels/attach', [
            'label_ids' => [$label->id],
        ]);

        $response->assertNotFound();
    }

    public function test_post_notes_note_labels_detach_detaches_labels_from_a_note(): void
    {
        $note = Note::factory()->create();
        $labels = Label::factory(3)->create();
        $note->labels()->attach($labels->pluck('id')->toArray());

        $labelsToDetach = $labels->take(2)->pluck('id')->toArray();

        $response = $this->postJson("/api/notes/{$note->id}/labels/detach", [
            'label_ids' => $labelsToDetach,
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'Labels detached successfully')
            ->assertJsonCount(1, 'data.labels');

        $this->assertEquals(1, $note->labels()->count());
    }

    public function test_post_notes_note_labels_detach_detaches_all_labels_from_a_note(): void
    {
        $note = Note::factory()->create();
        $labels = Label::factory(3)->create();
        $note->labels()->attach($labels->pluck('id')->toArray());

        $response = $this->postJson("/api/notes/{$note->id}/labels/detach", [
            'label_ids' => $labels->pluck('id')->toArray(),
        ]);

        $response->assertOk()->assertJsonCount(0, 'data.labels');

        $this->assertEquals(0, $note->labels()->count());
    }

    public function test_post_notes_note_labels_detach_detaches_a_single_label_from_a_note(): void
    {
        $note = Note::factory()->create();
        $labels = Label::factory(2)->create();
        $note->labels()->attach($labels->pluck('id')->toArray());

        $response = $this->postJson("/api/notes/{$note->id}/labels/detach", [
            'label_ids' => [$labels->first()->id],
        ]);

        $response->assertOk()->assertJsonCount(1, 'data.labels');

        $this->assertEquals(1, $note->labels()->count());
    }

    public function test_post_notes_note_labels_detach_fails_validation_when_label_ids_is_missing(): void
    {
        $note = Note::factory()->create();

        $response = $this->postJson("/api/notes/{$note->id}/labels/detach", []);

        $response->assertUnprocessable()->assertJsonValidationErrors('label_ids');
    }

    public function test_post_notes_note_labels_detach_fails_validation_when_label_ids_is_empty_array(): void
    {
        $note = Note::factory()->create();

        $response = $this->postJson("/api/notes/{$note->id}/labels/detach", [
            'label_ids' => [],
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('label_ids');
    }

    public function test_post_notes_note_labels_detach_fails_validation_when_label_ids_contains_nonexistent_label(): void
    {
        $note = Note::factory()->create();

        $response = $this->postJson("/api/notes/{$note->id}/labels/detach", [
            'label_ids' => [9999],
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('label_ids.0');
    }

    public function test_post_notes_note_labels_detach_returns_404_when_note_does_not_exist(): void
    {
        $label = Label::factory()->create();

        $response = $this->postJson('/api/notes/9999/labels/detach', [
            'label_ids' => [$label->id],
        ]);

        $response->assertNotFound();
    }

    public function test_post_notes_note_labels_detach_silently_succeeds_when_detaching_non_attached_label(): void
    {
        $note = Note::factory()->create();
        $label1 = Label::factory()->create();
        $label2 = Label::factory()->create();

        $note->labels()->attach($label1->id);

        $response = $this->postJson("/api/notes/{$note->id}/labels/detach", [
            'label_ids' => [$label2->id],
        ]);

        $response->assertOk();

        $this->assertTrue($note->labels()->where('id', $label1->id)->exists());
    }
}

