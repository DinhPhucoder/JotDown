<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Note;
use App\Models\NoteShare;
use App\Models\User;

final class NotePolicy
{
    /**
     * Chủ sở hữu mới được chia sẻ ghi chú.
     */
    public function share(User $user, Note $note): bool
    {
        return $note->user_id === $user->id;
    }

    /**
     * Chủ sở hữu mới được quản lý (cập nhật/thu hồi) quyền chia sẻ.
     */
    public function manageShare(User $user, Note $note): bool
    {
        return $note->user_id === $user->id;
    }

    /**
     * Chủ sở hữu hoặc người được share quyền EDIT mới được cập nhật note.
     */
    public function update(User $user, Note $note): bool
    {
        if ($note->user_id === $user->id) {
            return true;
        }

        return NoteShare::where('note_id', $note->id)
            ->where('receiver_id', $user->id)
            ->where('permission', 'EDIT')
            ->whereNull('deleted_at')
            ->exists();
    }

    /**
     * Chỉ chủ sở hữu mới được xóa ghi chú.
     */
    public function delete(User $user, Note $note): bool
    {
        return $note->user_id === $user->id;
    }

    /**
     * Chủ sở hữu hoặc người được share (READ hoặc EDIT) đều xem được.
     */
    public function view(User $user, Note $note): bool
    {
        if ($note->user_id === $user->id) {
            return true;
        }

        return NoteShare::where('note_id', $note->id)
            ->where('receiver_id', $user->id)
            ->whereNull('deleted_at')
            ->exists();
    }
}
