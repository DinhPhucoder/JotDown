<?php

namespace App\Http\Controllers;

use App\Events\NoteUpdated;
use App\Http\Requests\AttachLabelsRequest;
use App\Http\Requests\DetachLabelsRequest;
use App\Http\Requests\StoreNoteRequest;
use App\Http\Requests\UpdateNoteRequest;
use App\Models\Note;
use App\Models\NoteAttachment;
use App\Services\CloudinaryAttachmentService;
use Illuminate\Support\Arr;

class NoteController extends Controller
{
    public function __construct(private readonly CloudinaryAttachmentService $attachmentService)
    {
    }

    //  GET ALL
    public function index()
    {
        $query = Note::with('attachments')
            ->orderBy('is_pinned', 'desc')
            ->orderBy('updated_at', 'desc');
        $userId = request()->user()?->id;

        if ($userId !== null) {
            $query->where('user_id', $userId);
        }

        return $query->get();
    }

    //  CREATE
    public function store(StoreNoteRequest $request)
    {
        $userId = $request->user()?->id ?? 1;
        $validated = $request->validated();
        $note = Note::create([
            'user_id' => $userId,
            'title' => (string) ($validated['title'] ?? ''),
            'content' => $validated['content'] ?? null,
            'color' => $validated['color'] ?? '#ffffff',
            'version' => 1,
        ]);

        if (isset($validated['attachments']) && is_array($validated['attachments'])) {
            foreach ($validated['attachments'] as $attachmentPayload) {
                $fileUrl = (string) ($attachmentPayload['file_url'] ?? '');
                $fileSize = (int) ($attachmentPayload['file_size'] ?? 0);
                $fileType = (string) ($attachmentPayload['file_type'] ?? '');

                $this->attachmentService->assertValidCloudinaryUrl($fileUrl);
                $this->attachmentService->assertAttachmentLimit($note, $fileSize);

                NoteAttachment::create([
                    'note_id' => $note->id,
                    'file_url' => $fileUrl,
                    'attachment_kind' => 'IMAGE',
                    'original_name' => $attachmentPayload['original_name'] ?? null,
                    'file_type' => $this->attachmentService->normalizeFileType($fileType),
                    'file_size' => $fileSize,
                ]);
            }
        }

        return response()->json($note->refresh()->load('attachments'), 201);
    }

    //  GET ONE
    public function show($id)
    {
        return Note::with('attachments')->findOrFail($id);
    }

    // UPDATE
    public function update(UpdateNoteRequest $request, $id)
    {
        $note = Note::with('attachments')->findOrFail($id);
        $validated = $request->validated();
        $requestVersion = (int) $validated['version'];

        if ($requestVersion < $note->version) {
            return response()->json([
                'message' => 'Conflict detected. The note has a newer server version.',
                'conflict' => true,
                'client_version' => $requestVersion,
                'server_version' => $note->version,
                'server_note' => $note->load('attachments'),
            ], 409);
        }

        $hasPinnedFlag = Arr::has($validated, 'is_pinned');
        $nextPinned = $hasPinnedFlag ? (bool) $validated['is_pinned'] : (bool) $note->is_pinned;

        $note->update([
            'title' => $validated['title'] ?? $note->title,
            'content' => $validated['content'] ?? $note->content,
            'color' => $validated['color'] ?? $note->color,
            'is_pinned' => $nextPinned,
            'pinned_at' => $hasPinnedFlag
                ? ($nextPinned ? now() : null)
                : $note->pinned_at,
            'version' => $note->version + 1,
        ]);

        $note->refresh()->load('attachments');
        event(new NoteUpdated($note, (string) ($request->user()?->id ?? 'system')));

        return $note;
    }

    // DELETE
    public function destroy($id)
    {
        $note = Note::findOrFail($id);
        $note->delete();

        return response()->json([
            'message' => 'Deleted successfully',
        ]);
    }

    // ATTACH LABELS
    public function attachLabels(AttachLabelsRequest $request, $id)
    {
        $note = Note::findOrFail($id);

        $note->labels()->syncWithoutDetaching($request->validated('label_ids'));

        return response()->json([
            'message' => 'Labels attached successfully',
            'data' => $note->load('labels'),
        ]);
    }

    // DETACH LABELS
    public function detachLabels(DetachLabelsRequest $request, $id)
    {
        $note = Note::findOrFail($id);

        $note->labels()->detach($request->validated('label_ids'));

        return response()->json([
            'message' => 'Labels detached successfully',
            'data' => $note->load('labels'),
        ]);
    }
}
