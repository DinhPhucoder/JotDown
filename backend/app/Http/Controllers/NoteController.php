<?php

namespace App\Http\Controllers;

use App\Models\Note;
use App\Http\Requests\StoreNoteRequest;
use App\Http\Requests\UpdateNoteRequest;
use App\Http\Requests\AttachLabelsRequest;
use App\Http\Requests\DetachLabelsRequest;
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
    public function store(StoreNoteRequest $request)
    {
        $note = Note::create([
            'user_id' => 1, // tạm thời
            'title' => $request->validated('title'),
            'content' => $request->validated('content'),
            'color' => $request->validated('color') ?? '#ffffff',
            'version' => 1,
        ]);

        return response()->json($note, 201);
    }

    //  GET ONE
    public function show($id)
    {
        return Note::findOrFail($id);
    }

    // UPDATE
    public function update(UpdateNoteRequest $request, $id)
    {
        $note = Note::findOrFail($id);

        $note->update([
            'title' => $request->validated('title') ?? $note->title,
            'content' => $request->validated('content') ?? $note->content,
            'color' => $request->validated('color') ?? $note->color,
            'is_pinned' => $request->validated('is_pinned') ?? $note->is_pinned,
            'pinned_at' => $request->validated('is_pinned') ? now() : null,
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

    // ATTACH LABELS
    public function attachLabels(AttachLabelsRequest $request, $id)
    {
        $note = Note::findOrFail($id);
        
        $note->labels()->syncWithoutDetaching($request->validated('label_ids'));

        return response()->json([
            'message' => 'Labels attached successfully',
            'data' => $note->load('labels')
        ]);
    }

    // DETACH LABELS
    public function detachLabels(DetachLabelsRequest $request, $id)
    {
        $note = Note::findOrFail($id);
        
        $note->labels()->detach($request->validated('label_ids'));

        return response()->json([
            'message' => 'Labels detached successfully',
            'data' => $note->load('labels')
        ]);
    }
}
