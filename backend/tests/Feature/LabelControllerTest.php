<?php

namespace Tests\Feature;

use App\Models\Label;
use App\Models\Note;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LabelControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        User::factory()->create(['id' => 1]);
    }

    public function test_get_labels_returns_empty_list_when_no_labels_exist(): void
    {
        $response = $this->getJson('/api/labels');

        $response->assertOk()->assertJson([]);
    }

    public function test_get_labels_returns_all_labels(): void
    {
        $labels = Label::factory(3)->create();

        $response = $this->getJson('/api/labels');

        $response->assertOk()->assertJsonCount(3);

        foreach ($labels as $label) {
            $response->assertJsonFragment(['id' => $label->id]);
        }
    }

    public function test_post_labels_creates_a_new_label_with_valid_data(): void
    {
        $data = [
            'name' => 'Important',
        ];

        $response = $this->postJson('/api/labels', $data);

        $response->assertCreated()
            ->assertJsonPath('name', 'Important');

        $this->assertDatabaseHas('labels', $data);
    }

    public function test_post_labels_fails_validation_when_name_is_missing(): void
    {
        $response = $this->postJson('/api/labels', []);

        $response->assertUnprocessable()->assertJsonValidationErrors('name');
    }

    public function test_post_labels_fails_validation_when_name_is_not_unique(): void
    {
        Label::factory()->create(['name' => 'Duplicate']);

        $response = $this->postJson('/api/labels', [
            'name' => 'Duplicate',
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('name');
    }

    public function test_post_labels_fails_validation_when_name_exceeds_max_length(): void
    {
        $response = $this->postJson('/api/labels', [
            'name' => str_repeat('a', 101),
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('name');
    }

    public function test_put_labels_id_updates_all_fields_when_provided(): void
    {
        $label = Label::factory()->create();

        $updateData = [
            'name' => 'Updated Label',
        ];

        $response = $this->putJson("/api/labels/{$label->id}", $updateData);

        $response->assertOk()
            ->assertJsonPath('name', 'Updated Label');

        $this->assertDatabaseHas('labels', [
            'id' => $label->id,
            'name' => 'Updated Label',
        ]);
    }

    public function test_put_labels_id_updates_only_provided_fields_keeps_others_unchanged(): void
    {
        $label = Label::factory()->create(['name' => 'Original']);

        $response = $this->putJson("/api/labels/{$label->id}", [
            'name' => 'Updated Name',
        ]);

        $response->assertOk()
            ->assertJsonPath('name', 'Updated Name');
    }

    public function test_put_labels_id_allows_updating_label_name_to_same_value(): void
    {
        $label = Label::factory()->create(['name' => 'Test Label']);

        $response = $this->putJson("/api/labels/{$label->id}", [
            'name' => 'Test Label',
        ]);

        $response->assertOk();
    }

    public function test_put_labels_id_fails_validation_when_updating_name_to_existing_name_of_another_label(): void
    {
        Label::factory()->create(['name' => 'Label 1']);
        $label2 = Label::factory()->create(['name' => 'Label 2']);

        $response = $this->putJson("/api/labels/{$label2->id}", [
            'name' => 'Label 1',
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('name');
    }

    public function test_put_labels_id_returns_404_when_label_does_not_exist(): void
    {
        $response = $this->putJson('/api/labels/9999', ['name' => 'New']);

        $response->assertNotFound();
    }

    public function test_delete_labels_id_deletes_a_label(): void
    {
        $label = Label::factory()->create();

        $response = $this->deleteJson("/api/labels/{$label->id}");

        $response->assertOk()->assertJsonPath('message', 'Deleted');

        $this->assertDatabaseMissing('labels', ['id' => $label->id]);
    }

    public function test_delete_labels_id_returns_404_when_label_does_not_exist(): void
    {
        $response = $this->deleteJson('/api/labels/9999');

        $response->assertNotFound();
    }

    public function test_delete_labels_id_cascades_delete_from_pivot_table(): void
    {
        $label = Label::factory()->create();
        $note = Note::factory()->create();
        $note->labels()->attach($label->id);

        $this->deleteJson("/api/labels/{$label->id}");

        $this->assertDatabaseMissing('note_labels', [
            'label_id' => $label->id,
        ]);
    }
}
