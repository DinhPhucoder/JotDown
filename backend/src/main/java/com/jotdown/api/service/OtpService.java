package com.jotdown.api.service;

import com.jotdown.api.entity.User;
import com.jotdown.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class OtpService {

    private final UserRepository userRepository;
    private final MailService mailService;

    @Transactional
    public void sendOtp(User user, String purpose) {
        // Throttle check: do not send if existing OTP is still active
        if (user.getOtpExpiresAt() != null && user.getOtpExpiresAt().isAfter(LocalDateTime.now())) {
            long secondsLeft = Duration.between(LocalDateTime.now(), user.getOtpExpiresAt()).toSeconds();
            if (secondsLeft > 0) {
                // Throwing specific exception to be handled as 429
                throw new ThrottledException("Vui lòng đợi " + secondsLeft + " giây trước khi gửi lại.");
            }
        }

        String otp = user.generateOtp();
        userRepository.save(user);

        mailService.sendOtpMail(user.getEmail(), otp, purpose);
    }

    @Transactional
    public boolean verifyOtp(User user, String code, String purpose) {
        if (!user.verifyOtp(code)) {
            return false;
        }

        if ("reset".equals(purpose)) {
            // Reset flow: verify but DO NOT clear OTP yet (resetPassword endpoint will verify and clear it)
            return true;
        }

        // Verify email flow: verify + mark verified + clear OTP
        if (user.getEmailVerifiedAt() == null) {
            user.setEmailVerifiedAt(LocalDateTime.now());
        }
        user.clearOtp();
        userRepository.save(user);
        return true;
    }

    // Custom runtime exception to handle 429 throttling
    public static class ThrottledException extends RuntimeException {
        public ThrottledException(String message) {
            super(message);
        }
    }
}
