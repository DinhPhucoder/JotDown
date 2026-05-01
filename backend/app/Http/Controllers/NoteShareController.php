<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Events\NoteShared;
use App\Http\Requests\ShareNoteRequest;
use App\Http\Resources\NoteShareResource;
use App\Mail\NoteSharedMail;
use App\Models\Note;
use App\Models\NoteShare;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Mail;

final class NoteShareController extends Controller
{
    /**
     * POST /api/v1/notes/{note}/share
     * Chia sẻ ghi chú với người dùng khác.
     */
    public function share(ShareNoteRequest $request, Note $note): JsonResponse
    {
        $this->authorize('share', $note);

        $sender = $request->user();
        $receiver = User::where('email', $request->validated('email'))->firstOrFail();

        // Ngăn share cho chính mình (double-check ngoài DB trigger)
        if ($receiver->id === $sender->id) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể chia sẻ ghi chú với chính bạn.',
            ], 422);
        }

        $permission = strtoupper($request->validated('permission'));

        // Restore soft-deleted share if it exists, otherwise create new
        $share = NoteShare::withTrashed()
            ->where('note_id', $note->id)
            ->where('receiver_id', $receiver->id)
            ->first();

        if ($share) {
            $share->restore();
            $share->update([
                'sender_id' => $sender->id,
                'permission' => $permission,
            ]);
        } else {
            $share = NoteShare::create([
                'note_id' => $note->id,
                'receiver_id' => $receiver->id,
                'sender_id' => $sender->id,
                'permission' => $permission,
            ]);
        }

        $share->load('receiver', 'sender');

        // Gửi email thông báo
        Mail::to($receiver->email)->queue(new NoteSharedMail($note, $sender, $receiver, $permission));

        // Broadcast realtime
            event(new NoteShared($note->load(['attachments', 'shares.receiver', 'user']), (string) $receiver->id, $sender, $permission));

        return response()->json([
            'success' => true,
            'message' => 'Chia sẻ ghi chú thành công.',
            'data' => new NoteShareResource($share),
        ], 201);
    }

    /**
     * GET /api/v1/notes/shared-with-me
     * Danh sách ghi chú được chia sẻ cho mình.
     */
    public function sharedWithMe(Request $request): AnonymousResourceCollection
    {
        $userId = $request->user()->id;

        $shares = NoteShare::with([
            'note.attachments', 
            'note.shares.receiver', 
            'note.user',
            'sender', 
            'receiver',
            'note.labels' => fn($q) => $q->where('labels.user_id', $userId)
        ])
            ->where('receiver_id', $userId)
            ->whereHas('note', fn ($q) => $q->whereNull('deleted_at'))
            ->latest()
            ->get();

        return NoteShareResource::collection($shares);
    }

    /**
     * PUT /api/v1/notes/{note}/shares/{share}
     * Cập nhật quyền của một share (READ <-> EDIT).
     */
    public function update(Request $request, Note $note, NoteShare $share): JsonResponse
    {
        $this->authorize('manageShare', $note);

        $request->validate([
            'permission' => ['required', 'string', 'in:read,edit'],
        ]);

        // Đảm bảo share thuộc về note này
        if ($share->note_id !== $note->id) {
            return response()->json([
                'success' => false,
                'message' => 'Share không thuộc ghi chú này.',
            ], 404);
        }

        $share->update(['permission' => strtoupper($request->input('permission'))]);
        $share->load('receiver', 'sender');

        // Broadcast cập nhật quyền realtime
        event(new NoteShared(
            $note->load(['attachments', 'shares.receiver', 'user']), 
            (string) $share->receiver_id, 
            $share->sender, 
            $share->permission
        ));

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật quyền thành công.',
            'data' => new NoteShareResource($share),
        ]);
    }

    /**
     * DELETE /api/v1/notes/{note}/shares/{share}
     * Thu hồi quyền chia sẻ.
     */
    public function revoke(Note $note, NoteShare $share): JsonResponse
    {
        $this->authorize('manageShare', $note);

        if ($share->note_id !== $note->id) {
            return response()->json([
                'success' => false,
                'message' => 'Share không thuộc ghi chú này.',
            ], 404);
        }

        $receiverId = (string) $share->receiver_id;
        $noteId = $note->id;

        $share->delete();

        // Broadcast thu hồi quyền realtime
        event(new \App\Events\NoteRevoked($noteId, $receiverId));

        return response()->json([
            'success' => true,
            'message' => 'Thu hồi quyền chia sẻ thành công.',
        ]);
    }
}
