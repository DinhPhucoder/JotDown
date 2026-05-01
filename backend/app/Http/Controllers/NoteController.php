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
use Illuminate\Support\Facades\Hash;
use Illuminate\Http\Request;

class NoteController extends Controller
{
    public function __construct(private readonly CloudinaryAttachmentService $attachmentService)
    {
    }

    //  GET ALL
    public function index()
    {
        $query = Note::with(['attachments', 'shares.receiver', 'user', 'labels' => fn($q) => $q->where('labels.user_id', request()->user()?->id)])
            ->orderBy('is_pinned', 'desc')
            ->orderBy('updated_at', 'desc');
        $userId = request()->user()?->id;

        if ($userId !== null) {
            $query->where('user_id', $userId);
        }

        $notes = $query->get();

        $notes->transform(function ($note) {
            return $this->maskProtectedNote($note);
        });

        return $notes;
    }

    private function maskProtectedNote($note)
    {
        if ($note->is_protected) {
            // Chuỗi giả để UI có chữ tạo hiệu ứng blur (bảo mật tuyệt đối vì text thật đã bị xóa)
            $note->content = '<p>Đã khoá bằng mật mã Da Vinci. <br/>PSG vs Bayern <br/>Ars vs Aletico</p>';
            $note->setRelation('attachments', collect([])); // Ẩn ảnh đính kèm
        }
        return $note;
    }

    //  CREATE
    public function store(StoreNoteRequest $request)
    {
        $userId = $request->user()?->id ?? 1;
        $validated = $request->validated();
        $isProtected = !empty($validated['is_protected']);
        $note = Note::create([
            'user_id' => $userId,
            'title' => (string) ($validated['title'] ?? ''),
            'content' => $validated['content'] ?? null,
            'color' => $validated['color'] ?? '#ffffff',
            'is_protected' => $isProtected,
            'password' => $isProtected && !empty($validated['password'])
                ? Hash::make($validated['password'])
                : null,
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

        return response()->json($note->refresh()->load(['attachments', 'shares.receiver', 'user', 'labels' => fn($q) => $q->where('labels.user_id', request()->user()?->id)]), 201);
    }

    //  GET ONE
    public function show($id)
    {
        $note = Note::with(['attachments', 'shares.receiver', 'user', 'labels' => fn($q) => $q->where('labels.user_id', request()->user()?->id)])->findOrFail($id);
        $this->authorize('view', $note);
        return $this->maskProtectedNote($note);
    }

    // UPDATE
    public function update(UpdateNoteRequest $request, $id)
    {
        $note = Note::with('attachments')->findOrFail($id);
        $this->authorize('update', $note);
        $validated = $request->validated();
        $requestVersion = (int) $validated['version'];

        if ($requestVersion < $note->version) {
            return response()->json([
                'message' => 'Conflict detected. The note has a newer server version.',
                'conflict' => true,
                'client_version' => $requestVersion,
                'server_version' => $note->version,
                'server_note' => $note->load(['attachments', 'shares.receiver', 'user', 'labels' => fn($q) => $q->where('labels.user_id', request()->user()?->id)]),
            ], 409);
        }

        $hasPinnedFlag = Arr::has($validated, 'is_pinned');
        $nextPinned = $hasPinnedFlag ? (bool) $validated['is_pinned'] : (bool) $note->is_pinned;

        $updateData = [
            'title' => $validated['title'] ?? $note->title,
            'content' => $validated['content'] ?? $note->content,
            'color' => $validated['color'] ?? $note->color,
            'is_pinned' => $nextPinned,
            'pinned_at' => $hasPinnedFlag
                ? ($nextPinned ? now() : null)
                : $note->pinned_at,
            'version' => $note->version + 1,
        ];

        // Xử lý khóa ghi chú
        if (Arr::has($validated, 'is_protected')) {
            $nextProtected = (bool) $validated['is_protected'];
            $updateData['is_protected'] = $nextProtected;

            if ($nextProtected && !empty($validated['password'])) {
                $updateData['password'] = Hash::make($validated['password']);
            } elseif (!$nextProtected) {
                $updateData['password'] = null;
            }
        }

        $note->update($updateData);

        $note->refresh()->load(['attachments', 'shares.receiver', 'user', 'labels' => fn($q) => $q->where('labels.user_id', request()->user()?->id)]);
        
        \Log::info('Broadcasting NoteUpdated event', [
            'note_id' => $note->id,
            'user_id' => $request->user()?->id,
            'broadcast_connection' => config('broadcasting.default'),
        ]);
        
        event(new NoteUpdated($note, (string) ($request->user()?->id ?? 'system')));

        return $note;
    }

    // DELETE
    public function destroy($id)
    {
        $note = Note::findOrFail($id);
        $this->authorize('delete', $note);
        $note->delete();

        return response()->json([
            'message' => 'Deleted successfully',
        ]);
    }

    // VERIFY NOTE PASSWORD
    public function verifyPassword(Request $request, $id)
    {
        $note = Note::findOrFail($id);

        if (!$note->is_protected || !$note->password) {
            return response()->json(['valid' => true, 'note' => $note->load(['attachments', 'shares.receiver', 'user', 'labels' => fn($q) => $q->where('labels.user_id', request()->user()?->id)])]);
        }

        $inputPassword = (string) $request->input('password', '');

        if (Hash::check($inputPassword, $note->password)) {
            return response()->json(['valid' => true, 'note' => $note->load(['attachments', 'shares.receiver', 'user', 'labels' => fn($q) => $q->where('labels.user_id', request()->user()?->id)])]);
        }

        return response()->json(['valid' => false, 'message' => 'Mật khẩu không đúng.'], 403);
    }

    // ATTACH LABELS
    public function attachLabels(AttachLabelsRequest $request, $id)
    {
        $note = Note::findOrFail($id);
        $this->authorize('view', $note);
        $userId = request()->user()?->id;

        $existing = \Illuminate\Support\Facades\DB::table('note_labels')
            ->where('note_id', $note->id)
            ->where('user_id', $userId)
            ->pluck('label_id')
            ->toArray();

        $newIds = array_diff($request->validated('label_ids'), $existing);
        
        if (!empty($newIds)) {
            $inserts = array_map(function($labelId) use ($note, $userId) {
                return [
                    'note_id' => $note->id,
                    'label_id' => $labelId,
                    'user_id' => $userId,
                ];
            }, $newIds);
            \Illuminate\Support\Facades\DB::table('note_labels')->insert($inserts);
        }

        return response()->json([
            'message' => 'Labels attached successfully',
            'data' => $note->load(['labels' => fn($q) => $q->where('labels.user_id', $userId)]),
        ]);
    }

    // DETACH LABELS
    public function detachLabels(DetachLabelsRequest $request, $id)
    {
        $note = Note::findOrFail($id);
        $this->authorize('view', $note);
        $userId = request()->user()?->id;

        \Illuminate\Support\Facades\DB::table('note_labels')
            ->where('note_id', $note->id)
            ->where('user_id', $userId)
            ->whereIn('label_id', $request->validated('label_ids'))
            ->delete();

        return response()->json([
            'message' => 'Labels detached successfully',
            'data' => $note->load(['labels' => fn($q) => $q->where('labels.user_id', $userId)]),
        ]);
    }
}
