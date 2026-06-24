package com.jotdown.api.controller;

import com.jotdown.api.dto.request.*;
import com.jotdown.api.dto.response.ApiResponse;
import com.jotdown.api.entity.User;
import com.jotdown.api.security.CurrentUser;
import com.jotdown.api.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<?>> register(@Valid @RequestBody RegisterRequest request) {
        ApiResponse<?> response = authService.register(request);
        if (!response.isSuccess()) {
            return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(response);
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<?>> login(@Valid @RequestBody LoginRequest request) {
        ApiResponse<?> response = authService.login(request);
        if (!response.isSuccess()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<?>> logout() {
        return ResponseEntity.ok(ApiResponse.success("Đăng xuất thành công!"));
    }

    @GetMapping("/user")
    public ResponseEntity<ApiResponse<?>> user(@CurrentUser User user) {
        return ResponseEntity.ok(authService.getUserInfo(user));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<?>> updateProfile(
            @CurrentUser User user,
            @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(authService.updateProfile(user, request));
    }

    @PostMapping("/upload-avatar")
    public ResponseEntity<ApiResponse<?>> uploadAvatar(
            @CurrentUser User user,
            @RequestParam("avatar") MultipartFile file) {
        try {
            return ResponseEntity.ok(authService.uploadAvatar(user, file));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.fail("Lỗi khi upload ảnh lên Cloudinary: " + e.getMessage()));
        }
    }

    @PutMapping("/preferences")
    public ResponseEntity<ApiResponse<?>> updatePreferences(
            @CurrentUser User user,
            @Valid @RequestBody UpdatePreferencesRequest request) {
        return ResponseEntity.ok(authService.updatePreferences(user, request));
    }

    @PutMapping("/change-password")
    public ResponseEntity<ApiResponse<?>> changePassword(
            @CurrentUser User user,
            @Valid @RequestBody ChangePasswordRequest request) {
        ApiResponse<?> response = authService.changePassword(user, request);
        if (!response.isSuccess()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/send-verify-otp")
    public ResponseEntity<ApiResponse<?>> sendVerifyOtp(@CurrentUser User user) {
        ApiResponse<?> response = authService.sendVerifyOtp(user);
        if (!response.isSuccess()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<?>> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        ApiResponse<?> response = authService.verifyOtp(request);
        if (!response.isSuccess()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<?>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        ApiResponse<?> response = authService.forgotPassword(request);
        if (!response.isSuccess()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<?>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        ApiResponse<?> response = authService.resetPassword(request);
        if (!response.isSuccess()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<ApiResponse<?>> resendOtp(@Valid @RequestBody ResendOtpRequest request) {
        ApiResponse<?> response = authService.resendOtp(request);
        if (!response.isSuccess()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/send-verification-link")
    public ResponseEntity<ApiResponse<?>> sendVerificationLink(@CurrentUser User user) {
        ApiResponse<?> response = authService.sendVerificationLink(user);
        if (!response.isSuccess()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/verify-email/{id}/{hash}")
    public ResponseEntity<Void> verifyEmail(
            @PathVariable("id") Long id,
            @PathVariable("hash") String hash,
            @RequestParam("expires") long expires,
            @RequestParam("signature") String signature) {
        String redirectUrl = authService.verifyEmailFromLink(id, hash, expires, signature);
        return ResponseEntity.status(HttpStatus.FOUND)
                .header("Location", redirectUrl)
                .build();
    }
}
