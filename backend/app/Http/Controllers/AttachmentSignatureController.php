<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\NoteAttachmentSignatureRequest;
use App\Services\CloudinaryAttachmentService;
use Illuminate\Http\JsonResponse;

class AttachmentSignatureController extends Controller
{
    public function __construct(private readonly CloudinaryAttachmentService $service)
    {
    }

    public function __invoke(NoteAttachmentSignatureRequest $request): JsonResponse
    {
        return response()->json([
            'data' => $this->service->buildSignaturePayload(),
        ]);
    }
}

