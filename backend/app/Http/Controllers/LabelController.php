<?php

namespace App\Http\Controllers;

use App\Models\Label;
use Illuminate\Http\Request;

class LabelController extends Controller
{
    //  GET ALL
    public function index()
    {
        return Label::all();
    }

    // CREATE
    public function store(Request $request)
    {
        $label = Label::create([
            'name' => $request->name,
            'color' => $request->color
        ]);

        return response()->json($label, 201);
    }

    //  UPDATE
    public function update(Request $request, $id)
    {
        $label = Label::findOrFail($id);

        $label->update([
            'name' => $request->name ?? $label->name,
            'color' => $request->color ?? $label->color
        ]);

        return $label;
    }

    // DELETE
    public function destroy($id)
    {
        Label::destroy($id);

        return response()->json([
            'message' => 'Deleted'
        ]);
    }
}
