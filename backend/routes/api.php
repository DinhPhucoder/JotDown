<?php

use App\Http\Controllers\Api\V1\AuthController;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use App\Http\Controllers\NoteController;
use App\Http\Controllers\LabelController;

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
        Route::get('user', [AuthController::class, 'user']);
        Route::put('update-profile', [AuthController::class, 'updateProfile']);
        Route::post('upload-avatar', [AuthController::class, 'uploadAvatar']);
    });
});

Route::apiResource('notes', NoteController::class);
Route::apiResource('labels', LabelController::class);

// Label attachment routes
Route::post('/notes/{note}/labels/attach', [NoteController::class, 'attachLabels']);
Route::post('/notes/{note}/labels/detach', [NoteController::class, 'detachLabels']);
