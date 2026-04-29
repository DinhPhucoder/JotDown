<?php

namespace Tests\Unit;

use App\Http\Requests\ShareNoteRequest;
use App\Http\Requests\SyncRequest;
use Tests\TestCase;

class RequestsTest extends TestCase
{
    public function test_share_note_request_rules()
    {
        $request = new ShareNoteRequest();
        
        $this->assertTrue($request->authorize());
        $this->assertArrayHasKey('email', $request->rules());
        $this->assertArrayHasKey('permission', $request->rules());
    }

    public function test_sync_request_rules()
    {
        $request = new SyncRequest();
        
        $this->assertTrue($request->authorize());
        $this->assertArrayHasKey('changes', $request->rules());
        $this->assertArrayHasKey('changes.*.action', $request->rules());
    }
}
