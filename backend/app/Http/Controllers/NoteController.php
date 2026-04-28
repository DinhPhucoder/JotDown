<?php

namespace App\Http\Controllers;

use App\Models\Note;
use Illuminate\Http\Request;

class NoteController extends Controller
{
    //  GET ALL
    public function index()
    {
        return Note::orderBy('is_pinned', 'desc')
                   ->orderBy('updated_at', 'desc')
                   ->get();
    }

    //  CREATE
    public function store(Request $request)
    {
        $note = Note::create([
            'user_id' => 1, // tạm thời
            'title' => $request->title,
            'content' => $request->content,
            'color' => $request->color ?? '#ffffff',
        ]);

        return response()->json($note, 201);
    }

    //  GET ONE
    public function show($id)
    {
        return Note::findOrFail($id);
    }

    // UPDATE
    public function update(Request $request, $id)
    {
        $note = Note::findOrFail($id);

        $note->update([
            'title' => $request->title ?? $note->title,
            'content' => $request->content ?? $note->content,
            'color' => $request->color ?? $note->color,
            'is_pinned' => $request->is_pinned ?? $note->is_pinned,
            'pinned_at' => $request->is_pinned ? now() : null,
            'version' => $note->version + 1
        ]);

        return $note;
    }

    // DELETE
    public function destroy($id)
    {
        $note = Note::findOrFail($id);
        $note->delete();

        return response()->json([
            'message' => 'Deleted successfully'
        ]);
    }
}
