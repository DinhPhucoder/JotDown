<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use App\Http\Controllers\NoteController;
use App\Http\Controllers\LabelController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::get('/health', function () {
    return response()->json(['status' => 'ok']);
});

Route::get('/ping', function () {
    try {
        \Illuminate\Support\Facades\DB::select('SELECT 1');
        return response()->json([
            'status' => 'alive', 
            'message' => 'Render & Aiven are awake!', 
            'time' => now()
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'message' => 'Render is awake, but Aiven connection failed!',
            'error' => $e->getMessage()
        ], 500);
    }
});

Route::apiResource('notes', NoteController::class);
Route::apiResource('labels', LabelController::class);

// Label attachment routes
Route::post('/notes/{note}/labels/attach', [NoteController::class, 'attachLabels']);
Route::post('/notes/{note}/labels/detach', [NoteController::class, 'detachLabels']);
