package com.jotdown.api.service;

import com.jotdown.api.dto.request.*;
import com.jotdown.api.dto.response.ApiResponse;
import com.jotdown.api.entity.User;
import com.jotdown.api.repository.UserRepository;
import com.jotdown.api.security.JwtTokenProvider;
import com.jotdown.api.exception.ValidationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final OtpService otpService;
    private final CloudinaryService cloudinaryService;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    // Configurable backend URL for email verification link, defaults to localhost:8000 (Laravel fallback) or 8080 (Spring Boot)
    @Value("${app.backend-url:http://localhost:8000}")
    private String backendUrl;

    @Transactional
    public ApiResponse<?> register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ValidationException("email", "Email đã tồn tại.");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        
        userRepository.save(user);

        Map<String, Object> userData = new HashMap<>();
        userData.put("id", user.getId());
        userData.put("name", user.getName());
        userData.put("email", user.getEmail());

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("user", userData);

        return ApiResponse.success("Đăng ký thành công!", responseData);
    }

    @Transactional
    public ApiResponse<?> login(LoginRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());

        if (userOpt.isEmpty() || !passwordEncoder.matches(request.getPassword(), userOpt.get().getPassword())) {
            return ApiResponse.fail("Email hoặc mật khẩu không chính xác.");
        }

        User user = userOpt.get();
        String token = tokenProvider.generateToken(user.getId(), user.getEmail());

        Map<String, Object> userData = new HashMap<>();
        userData.put("id", user.getId());
        userData.put("name", user.getName());
        userData.put("email", user.getEmail());
        userData.put("avatar", resolveAvatarUrl(user.getAvatar()));
        userData.put("email_verified", user.isEmailVerified());
        userData.put("preferences", user.getPreferences());

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("token", token);
        responseData.put("user", userData);

        return ApiResponse.success("Đăng nhập thành công!", responseData);
    }

    @Transactional(readOnly = true)
    public ApiResponse<?> getUserInfo(User user) {
        Map<String, Object> userData = new HashMap<>();
        userData.put("id", user.getId());
        userData.put("name", user.getName());
        userData.put("email", user.getEmail());
        userData.put("avatar", resolveAvatarUrl(user.getAvatar()));
        userData.put("email_verified", user.isEmailVerified());
        userData.put("preferences", user.getPreferences());
        userData.put("created_at", user.getCreatedAt());

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("user", userData);

        return ApiResponse.success(null, responseData);
    }

    @Transactional
    public ApiResponse<?> updateProfile(User user, UpdateProfileRequest request) {
        user.setName(request.getName());
        userRepository.save(user);

        Map<String, Object> userData = new HashMap<>();
        userData.put("id", user.getId());
        userData.put("name", user.getName());
        userData.put("email", user.getEmail());
        userData.put("avatar", resolveAvatarUrl(user.getAvatar()));
        userData.put("email_verified", user.isEmailVerified());

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("user", userData);

        return ApiResponse.success("Cập nhật hồ sơ thành công!", responseData);
    }

    @Transactional
    public ApiResponse<?> uploadAvatar(User user, MultipartFile file) throws Exception {
        String avatarUrl = cloudinaryService.uploadAvatar(file);
        user.setAvatar(avatarUrl);
        userRepository.save(user);

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("avatar", avatarUrl);

        return ApiResponse.success("Cập nhật ảnh đại diện thành công!", responseData);
    }

    @Transactional
    public ApiResponse<?> updatePreferences(User user, UpdatePreferencesRequest request) {
        user.setPreferences(request.getPreferences());
        userRepository.save(user);

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("preferences", user.getPreferences());

        return ApiResponse.success("Cập nhật cài đặt thành công!", responseData);
    }

    @Transactional
    public ApiResponse<?> changePassword(User user, ChangePasswordRequest request) {
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            return ApiResponse.fail("Mật khẩu hiện tại không chính xác.");
        }

        user.setPassword(passwordEncoder.encode(request.getPassword()));
        userRepository.save(user);

        return ApiResponse.success("Đổi mật khẩu thành công!");
    }

    @Transactional
    public ApiResponse<?> sendVerifyOtp(User user) {
        if (user.isEmailVerified()) {
            return ApiResponse.fail("Email đã được xác thực trước đó.");
        }

        otpService.sendOtp(user, "verify");
        return ApiResponse.success("Đã gửi mã xác thực đến email của bạn.");
    }

    @Transactional
    public ApiResponse<?> verifyOtp(VerifyOtpRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        if (userOpt.isEmpty()) {
            return ApiResponse.fail("Email không tồn tại.");
        }

        User user = userOpt.get();
        boolean verified = otpService.verifyOtp(user, request.getOtp(), request.getPurpose());
        if (!verified) {
            return ApiResponse.fail("Mã OTP không hợp lệ hoặc đã hết hạn.");
        }

        if ("reset".equals(request.getPurpose())) {
            return ApiResponse.success("Mã OTP hợp lệ!");
        }

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("email_verified", true);

        return ApiResponse.success("Xác thực thành công!", responseData);
    }

    @Transactional
    public ApiResponse<?> forgotPassword(ForgotPasswordRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        if (userOpt.isEmpty()) {
            return ApiResponse.fail("Email không tồn tại.");
        }

        otpService.sendOtp(userOpt.get(), "reset");
        return ApiResponse.success("Đã gửi mã xác thực đến email của bạn.");
    }

    @Transactional
    public ApiResponse<?> resetPassword(ResetPasswordRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        if (userOpt.isEmpty()) {
            return ApiResponse.fail("Email không tồn tại.");
        }

        User user = userOpt.get();
        if (!user.verifyOtp(request.getOtp())) {
            return ApiResponse.fail("Mã OTP không hợp lệ hoặc đã hết hạn.");
        }

        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.clearOtp();
        userRepository.save(user);

        return ApiResponse.success("Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.");
    }

    @Transactional
    public ApiResponse<?> resendOtp(ResendOtpRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        if (userOpt.isEmpty()) {
            return ApiResponse.fail("Email không tồn tại.");
        }

        otpService.sendOtp(userOpt.get(), request.getPurpose());
        return ApiResponse.success("Đã gửi lại mã xác thực.");
    }

    @Transactional
    public ApiResponse<?> sendVerificationLink(User user) {
        if (user.isEmailVerified()) {
            return ApiResponse.fail("Email đã được xác thực trước đó.");
        }

        String verificationUrl = generateVerificationLink(user);
        mailService.sendVerifyEmailMail(user.getEmail(), verificationUrl);
        return ApiResponse.success("Đã gửi link xác thực đến email của bạn. Vui lòng kiểm tra hộp thư.");
    }

    // Let's add MailService dependency to send verification links
    private final MailService mailService;

    @Transactional
    public String verifyEmailFromLink(Long id, String hash, long expires, String signature) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return redirectUrl("error", "Tài khoản không tồn tại.");
        }

        User user = userOpt.get();
        if (!hashEquals(sha1(user.getEmail()), hash)) {
            return redirectUrl("error", "Link xác thực không hợp lệ.");
        }

        if (System.currentTimeMillis() > expires) {
            return redirectUrl("error", "Link xác thực đã hết hạn. Vui lòng gửi lại.");
        }

        String dataToSign = id + ":" + hash + ":" + expires;
        if (!verifySignature(dataToSign, signature)) {
            return redirectUrl("error", "Link xác thực không hợp lệ.");
        }

        if (user.getEmailVerifiedAt() == null) {
            user.setEmailVerifiedAt(LocalDateTime.now());
            userRepository.save(user);
        }

        return redirectUrl("success", null);
    }

    private String generateVerificationLink(User user) {
        long expires = System.currentTimeMillis() + 60 * 60 * 1000; // 60 minutes
        String hash = sha1(user.getEmail());
        String dataToSign = user.getId() + ":" + hash + ":" + expires;
        String signature = hmacSha256(dataToSign);

        return backendUrl + "/api/v1/auth/verify-email/" + user.getId() + "/" + hash +
                "?expires=" + expires + "&signature=" + signature;
    }

    private boolean verifySignature(String data, String signature) {
        return hmacSha256(data).equals(signature);
    }

    private String hmacSha256(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(jwtSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("HMAC-SHA256 signature generation failed", e);
        }
    }

    private String sha1(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-1");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-1 algorithm not found", e);
        }
    }

    private boolean hashEquals(String a, String b) {
        return MessageDigest.isEqual(a.getBytes(StandardCharsets.UTF_8), b.getBytes(StandardCharsets.UTF_8));
    }

    private String redirectUrl(String status, String message) {
        String url = frontendUrl + "/verify-email-result?status=" + status;
        if (message != null) {
            url += "&message=" + java.net.URLEncoder.encode(message, StandardCharsets.UTF_8);
        }
        return url;
    }

    private String resolveAvatarUrl(String avatar) {
        if (avatar == null) {
            return null;
        }
        if (avatar.startsWith("http")) {
            return avatar;
        }
        // Resolves local avatar to full asset path: /storage/avatar.png -> backendUrl/storage/avatar.png
        return backendUrl + "/storage/" + avatar;
    }
}
