<?php

namespace App\Http\Controllers;

use App\Models\Label;
use App\Http\Requests\StoreLabelRequest;
use App\Http\Requests\UpdateLabelRequest;
use Illuminate\Http\Request;

class LabelController extends Controller
{
    //  GET ALL
    public function index()
    {
        return Label::all();
    }

    // CREATE
    public function store(StoreLabelRequest $request)
    {
        $label = Label::create([
            'user_id' => 1,
            'name' => $request->validated('name'),
        ]);

        return response()->json($label, 201);
    }

    //  UPDATE
    public function update(UpdateLabelRequest $request, $id)
    {
        $label = Label::findOrFail($id);

        $label->update([
            'name' => $request->validated('name') ?? $label->name,
        ]);

        return $label;
    }

    // DELETE
    public function destroy($id)
    {
        $label = Label::findOrFail($id);
        $label->delete();

        return response()->json([
            'message' => 'Deleted'
        ]);
    }
}
