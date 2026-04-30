<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Events\NoteUpdated;
use App\Http\Requests\NoteAttachmentSignatureRequest;
use App\Http\Requests\StoreNoteAttachmentRequest;
use App\Http\Resources\NoteAttachmentResource;
use App\Models\Note;
use App\Models\NoteAttachment;
use App\Services\CloudinaryAttachmentService;
use Illuminate\Http\JsonResponse;

class NoteAttachmentController extends Controller
{
    public function __construct(private readonly CloudinaryAttachmentService $service)
    {
    }

    public function signature(NoteAttachmentSignatureRequest $request, Note $note): JsonResponse
    {
        $this->service->authorizeAttachmentAccess($note, $request->user());

        return response()->json([
            'data' => $this->service->buildSignaturePayload(),
        ]);
    }

    public function store(StoreNoteAttachmentRequest $request, Note $note): JsonResponse
    {
        $this->service->authorizeAttachmentAccess($note, $request->user());

        $validated = $request->validated();
        $this->service->assertValidCloudinaryUrl((string) $validated['file_url']);
        $this->service->assertAttachmentLimit($note, (int) $validated['file_size']);

        $attachment = NoteAttachment::create([
            'note_id' => $note->id,
            'file_url' => (string) $validated['file_url'],
            'attachment_kind' => 'IMAGE',
            'original_name' => $validated['original_name'] ?? null,
            'file_type' => $this->service->normalizeFileType((string) $validated['file_type']),
            'file_size' => (int) $validated['file_size'],
        ]);

        $note->refresh()->load('attachments');
        event(new NoteUpdated($note, (string) ($request->user()?->id ?? 'system')));

        return response()->json([
            'message' => 'Saved attachment successfully.',
            'data' => new NoteAttachmentResource($attachment),
        ], 201);
    }

    public function destroy(NoteAttachmentSignatureRequest $request, Note $note, NoteAttachment $attachment): JsonResponse
    {
        $this->service->authorizeAttachmentAccess($note, $request->user());

        if ((int) $attachment->note_id !== (int) $note->id) {
            return response()->json([
                'message' => 'Attachment does not belong to this note.',
            ], 422);
        }

        $attachment->delete();
        $note->refresh()->load('attachments');
        event(new NoteUpdated($note, (string) ($request->user()?->id ?? 'system')));

        return response()->json([
            'message' => 'Attachment deleted successfully.',
        ]);
    }
}
