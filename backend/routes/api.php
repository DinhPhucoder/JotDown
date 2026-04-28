<?php

use App\Http\Controllers\Api\V1\AuthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::get('/health', function () {
    return response()->json(['status' => 'ok']);
});

Route::get('/ping', function () {
    return response()->json([
        'status' => 'alive',
        'message' => 'Render instance is awake!',
        'time' => now(),
    ]);
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
    });
});
