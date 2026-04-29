<?php

use Illuminate\Support\Facades\Broadcast;
use App\Models\Note;
use App\Models\NoteShare;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('note.{noteId}', function ($user, $noteId) {
    $noteId = (int) $noteId;
    $note = Note::find($noteId);
    
    if (!$note) {
        return false;
    }

    return $user->id === $note->user_id
        || NoteShare::where('note_id', $noteId)
            ->where('receiver_id', $user->id)
            ->exists();
});

Broadcast::channel('user.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

