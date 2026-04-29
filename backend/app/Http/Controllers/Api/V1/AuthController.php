<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Requests\Auth\VerifyOtpRequest;
use App\Mail\OtpMail;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

class AuthController extends Controller
{
    /**
     * Đăng ký tài khoản mới.
     * Không gửi OTP — user đăng nhập ngay, xác thực email sau.
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => $request->password, // Auto-hashed via cast
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Đăng ký thành công!',
            'data' => [
                'user' => $user->only(['id', 'name', 'email']),
            ],
        ], 201);
    }

    /**
     * Đăng nhập — cho phép cả user chưa verify email.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Email hoặc mật khẩu không chính xác.',
                'data' => null,
            ], 401);
        }

        // Xóa token cũ (đăng nhập lại = session mới)
        $user->tokens()->delete();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Đăng nhập thành công!',
            'data' => [
                'token' => $token,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar' => $user->avatar,
                    'email_verified' => !is_null($user->email_verified_at),
                ],
            ],
        ]);
    }

    /**
     * Đăng xuất — xóa token hiện tại.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Đăng xuất thành công!',
            'data' => null,
        ]);
    }

    /**
     * Gửi OTP xác thực email (user tự chọn khi muốn verify).
     */
    public function sendVerifyOtp(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->email_verified_at) {
            return response()->json([
                'success' => false,
                'message' => 'Email đã được xác thực trước đó.',
                'data' => null,
            ], 400);
        }

        // Throttle: không gửi lại nếu OTP còn hiệu lực
        if ($user->otp_expires_at && $user->otp_expires_at->isFuture()) {
            $secondsLeft = now()->diffInSeconds($user->otp_expires_at);
            return response()->json([
                'success' => false,
                'message' => "Vui lòng đợi {$secondsLeft} giây trước khi gửi lại.",
                'data' => null,
            ], 429);
        }

        $otp = $user->generateOtp();
        Mail::to($user->email)->send(new OtpMail($otp, 'verify'));

        return response()->json([
            'success' => true,
            'message' => 'Đã gửi mã xác thực đến email của bạn.',
            'data' => null,
        ]);
    }

    /**
     * Xác thực OTP — dùng cho cả verify email và reset password.
     */
    public function verifyOtp(VerifyOtpRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        if (!$user->verifyOtp($request->otp)) {
            return response()->json([
                'success' => false,
                'message' => 'Mã OTP không hợp lệ hoặc đã hết hạn.',
                'data' => null,
            ], 400);
        }

        // Nếu email chưa verified → xác thực email
        if (!$user->email_verified_at) {
            $user->email_verified_at = now();
            $user->save();
        }

        $user->clearOtp();

        return response()->json([
            'success' => true,
            'message' => 'Xác thực thành công!',
            'data' => [
                'email_verified' => true,
            ],
        ]);
    }

    /**
     * Quên mật khẩu — gửi OTP qua email.
     */
    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        // Throttle: không gửi lại nếu OTP còn hiệu lực
        if ($user->otp_expires_at && $user->otp_expires_at->isFuture()) {
            $secondsLeft = now()->diffInSeconds($user->otp_expires_at);
            return response()->json([
                'success' => false,
                'message' => "Vui lòng đợi {$secondsLeft} giây trước khi gửi lại.",
                'data' => null,
            ], 429);
        }

        $otp = $user->generateOtp();
        Mail::to($user->email)->send(new OtpMail($otp, 'reset'));

        return response()->json([
            'success' => true,
            'message' => 'Đã gửi mã xác thực đến email của bạn.',
            'data' => null,
        ]);
    }

    /**
     * Đặt lại mật khẩu — verify OTP + set password mới.
     */
    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        if (!$user->verifyOtp($request->otp)) {
            return response()->json([
                'success' => false,
                'message' => 'Mã OTP không hợp lệ hoặc đã hết hạn.',
                'data' => null,
            ], 400);
        }

        $user->update(['password' => $request->password]);
        $user->clearOtp();

        // Xóa tất cả token (buộc đăng nhập lại)
        $user->tokens()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.',
            'data' => null,
        ]);
    }

    /**
     * Đổi mật khẩu (cần đăng nhập).
     */
    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Mật khẩu hiện tại không chính xác.',
                'data' => null,
            ], 400);
        }

        $user->update(['password' => $request->password]);

        return response()->json([
            'success' => true,
            'message' => 'Đổi mật khẩu thành công!',
            'data' => null,
        ]);
    }

    /**
     * Gửi lại OTP (public — dùng cho forgot password flow).
     */
    public function resendOtp(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email', 'exists:users,email'],
            'purpose' => ['required', 'in:verify,reset'],
        ]);

        $user = User::where('email', $request->email)->first();

        // Throttle
        if ($user->otp_expires_at && $user->otp_expires_at->isFuture()) {
            $secondsLeft = now()->diffInSeconds($user->otp_expires_at);
            return response()->json([
                'success' => false,
                'message' => "Vui lòng đợi {$secondsLeft} giây trước khi gửi lại.",
                'data' => null,
            ], 429);
        }

        $otp = $user->generateOtp();
        Mail::to($user->email)->send(new OtpMail($otp, $request->purpose));

        return response()->json([
            'success' => true,
            'message' => 'Đã gửi lại mã xác thực.',
            'data' => null,
        ]);
    }

    /**
     * Lấy thông tin user hiện tại.
     */
    public function user(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'message' => null,
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar' => $user->avatar,
                    'email_verified' => !is_null($user->email_verified_at),
                    'preferences' => $user->preferences,
                    'created_at' => $user->created_at,
                ],
            ],
        ]);
    }

    /**
     * Cập nhật thông tin profile (tên).
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $user = $request->user();
        $user->update(['name' => $request->name]);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật hồ sơ thành công!',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar' => $user->avatar ? asset('storage/' . $user->avatar) : null,
                    'email_verified' => !is_null($user->email_verified_at),
                ],
            ],
        ]);
    }

    /**
     * Upload avatar.
     */
    public function uploadAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpeg,png,webp', 'max:5120'], // max 5MB
        ]);

        $user = $request->user();

        // Xóa avatar cũ nếu có
        if ($user->avatar && \Illuminate\Support\Facades\Storage::disk('public')->exists($user->avatar)) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($user->avatar);
        }

        $path = $request->file('avatar')->store('avatars', 'public');
        $user->update(['avatar' => $path]);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật ảnh đại diện thành công!',
            'data' => [
                'avatar' => asset('storage/' . $path),
            ],
        ]);
    }

    /**
     * Cập nhật preferences (cài đặt ứng dụng).
     */
    public function updatePreferences(Request $request): JsonResponse
    {
        $request->validate([
            'preferences' => ['required', 'array'],
        ]);

        $user = $request->user();
        $user->update(['preferences' => $request->preferences]);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật cài đặt thành công!',
            'data' => [
                'preferences' => $user->preferences,
            ],
        ]);
    }
}
