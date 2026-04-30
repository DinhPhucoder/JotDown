<?php

namespace App\Http\Controllers;

use App\Models\Label;
use App\Http\Requests\StoreLabelRequest;
use App\Http\Requests\UpdateLabelRequest;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class LabelController extends Controller
{
    //  GET ALL
    public function index(Request $request)
    {
        $userId = $request->user()?->id;

        return Label::query()
            ->when($userId !== null, fn ($query) => $query->where('user_id', $userId))
            ->get();
    }

    // CREATE
    public function store(StoreLabelRequest $request)
    {
        $userId = $request->user()?->id;
        if ($userId === null) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $label = Label::create([
            'user_id' => $userId,
            'name' => $request->validated('name'),
        ]);

        return response()->json($label, 201);
    }

    //  UPDATE
    public function update(UpdateLabelRequest $request, $id)
    {
        $label = Label::findOrFail($id);
        $userId = $request->user()?->id;

        if ($userId === null) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if ((int) $label->user_id !== (int) $userId) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $label->update([
            'name' => $request->validated('name') ?? $label->name,
        ]);

        return $label;
    }

    // DELETE
    public function destroy(Request $request, $id)
    {
        $label = Label::findOrFail($id);
        $userId = $request->user()?->id;

        if ($userId === null) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if ((int) $label->user_id !== (int) $userId) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }
        $label->delete();

        return response()->json([
            'message' => 'Deleted'
        ]);
    }
}
