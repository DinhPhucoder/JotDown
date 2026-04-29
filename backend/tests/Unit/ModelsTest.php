<?php

namespace Tests\Unit;

use App\Models\Note;
use App\Models\NoteShare;
use App\Models\SyncQueue;
use App\Models\User;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Tests\TestCase;

class ModelsTest extends TestCase
{
    public function test_note_share_model_properties_and_relationships()
    {
        $model = new NoteShare();
        
        $this->assertEquals(['note_id', 'sender_id', 'receiver_id', 'permission'], $model->getFillable());
        $this->assertInstanceOf(BelongsTo::class, $model->note());
        $this->assertInstanceOf(BelongsTo::class, $model->sender());
        $this->assertInstanceOf(BelongsTo::class, $model->receiver());
    }

    public function test_sync_queue_model_properties_and_relationships()
    {
        $model = new SyncQueue();
        
        $this->assertEquals(['user_id', 'action', 'entity_id', 'payload', 'synced_at'], $model->getFillable());
        $this->assertArrayHasKey('payload', $model->getCasts());
        $this->assertInstanceOf(BelongsTo::class, $model->user());
    }

    public function test_note_relationships()
    {
        $model = new Note();
        $this->assertInstanceOf(BelongsTo::class, $model->user());
        $this->assertInstanceOf(HasMany::class, $model->shares());
    }

    public function test_user_relationships()
    {
        $model = new User();
        $this->assertInstanceOf(HasMany::class, $model->notes());
        $this->assertInstanceOf(HasMany::class, $model->sharedNotes());
        $this->assertInstanceOf(HasMany::class, $model->receivedShares());
    }
}
