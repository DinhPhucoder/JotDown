<?php

use App\Http\Controllers\Api\V1\AuthController;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use App\Http\Controllers\NoteController;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Http\Request as HttpRequest;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\NoteShareController;
use App\Http\Controllers\LabelController;
use App\Http\Controllers\NoteAttachmentController;
use App\Http\Controllers\AttachmentSignatureController;
use App\Http\Controllers\SyncController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
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

/*
|--------------------------------------------------------------------------
| Auth Routes — v1
|--------------------------------------------------------------------------
*/
Route::prefix('v1/auth')->group(function () {

    // Public routes
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
    Route::post('verify-otp', [AuthController::class, 'verifyOtp']);
    Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('reset-password', [AuthController::class, 'resetPassword']);
    Route::post('resend-otp', [AuthController::class, 'resendOtp']);

    // Protected routes (cần token Sanctum)
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('change-password', [AuthController::class, 'changePassword']);
        Route::post('send-verify-otp', [AuthController::class, 'sendVerifyOtp']);
        Route::post('send-verification-link', [AuthController::class, 'sendVerificationLink']);
        Route::get('user', [AuthController::class, 'user']);
        Route::put('update-profile', [AuthController::class, 'updateProfile']);
        Route::post('upload-avatar', [AuthController::class, 'uploadAvatar']);
        Route::put('update-preferences', [AuthController::class, 'updatePreferences']);
    });
    // Public: xác thực email từ link (signed URL)
    Route::get('verify-email/{id}/{hash}', [AuthController::class, 'verifyEmailFromLink'])
        ->name('verification.verify');
});

Route::apiResource('notes', NoteController::class);

// Wrapper for broadcasting auth with extra error logging to capture 500s during channel authorization
Route::post('/broadcasting/auth', function (HttpRequest $request) {
    try {
        return Broadcast::auth($request);
    } catch (\Throwable $e) {
        Log::error('Broadcasting auth failed', [
            'message' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
            'payload' => $request->all(),
        ]);

        return response()->json(['message' => 'Broadcasting auth failed'], 500);
    }
})->middleware('auth:sanctum');

Route::middleware('auth:sanctum')->prefix('v1')->group(function () {
    // Label attachment routes
    Route::post('/notes/{note}/labels/attach', [NoteController::class, 'attachLabels']);
    Route::post('/notes/{note}/labels/detach', [NoteController::class, 'detachLabels']);
    // Note Sharing
    Route::get('/notes/shared-with-me', [NoteShareController::class, 'sharedWithMe']);
    Route::post('/notes/{note}/share', [NoteShareController::class, 'share']);
    Route::put('/notes/{note}/shares/{share}', [NoteShareController::class, 'update']);
    Route::delete('/notes/{note}/shares/{share}', [NoteShareController::class, 'revoke']);

    // Sync (Offline)
    Route::post('/sync/push', [SyncController::class, 'push']);
    Route::get('/sync/pull', [SyncController::class, 'pull']);

    // Attachments
    Route::post('/attachments/signature', AttachmentSignatureController::class);
    Route::post('/notes/{note}/attachments/signature', [NoteAttachmentController::class, 'signature']);
    Route::post('/notes/{note}/attachments', [NoteAttachmentController::class, 'store']);
    Route::delete('/notes/{note}/attachments/{attachment}', [NoteAttachmentController::class, 'destroy']);

    // Note lock: verify password
    Route::post('/notes/{note}/verify-password', [NoteController::class, 'verifyPassword']);

    // Core Resources
    Route::apiResource('notes', NoteController::class)->names('v1.notes');
    Route::apiResource('labels', LabelController::class)->names('v1.labels');
});

