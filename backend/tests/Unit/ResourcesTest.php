<?php

namespace Tests\Unit;

use App\Http\Resources\NoteShareResource;
use App\Http\Resources\SyncResultResource;
use App\Models\NoteShare;
use App\Models\User;
use Illuminate\Http\Request;
use Tests\TestCase;

class ResourcesTest extends TestCase
{
    public function test_transforms_note_share_correctly()
    {
        $receiver = new User();
        $receiver->id = 2;
        $receiver->name = 'Receiver';
        $receiver->email = 'rec@test.com';

        $share = new NoteShare([
            'note_id' => 10,
            'sender_id' => 1,
            'permission' => 'edit',
        ]);
        $share->id = 1;
        $share->setRelation('receiver', $receiver);
        
        $resource = new NoteShareResource($share);
        $array = $resource->toArray(new Request());
        
        $this->assertArrayHasKey('id', $array);
        $this->assertArrayHasKey('note_id', $array);
        $this->assertArrayHasKey('sender_id', $array);
        $this->assertArrayHasKey('receiver', $array);
        $this->assertArrayHasKey('permission', $array);
        
        $this->assertEquals('rec@test.com', $array['receiver']['email']);
    }

    public function test_transforms_sync_result_correctly()
    {
        $data = [
            'success_count' => 5,
            'failed_count' => 1,
            'conflicts' => ['item1'],
        ];
        $resource = new SyncResultResource($data);
        $array = $resource->toArray(new Request());
        
        $this->assertEquals(5, $array['success_count']);
        $this->assertEquals(1, $array['failed_count']);
        $this->assertCount(1, $array['conflicts']);
        $this->assertArrayHasKey('timestamp', $array);
    }
}
