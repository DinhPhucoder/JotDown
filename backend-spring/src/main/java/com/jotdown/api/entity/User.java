package com.jotdown.api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    /**
     * Cloudinary URL (starts with "http") or local storage path.
     * Always resolve to full URL before returning to client.
     */
    private String avatar;

    /**
     * JSON object storing user UI preferences (theme, language, etc.)
     * No fixed schema — store and return as-is.
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "json")
    private Map<String, Object> preferences;

    /** Null = email not verified */
    @Column(name = "email_verified_at")
    private LocalDateTime emailVerifiedAt;

    /** 6-digit OTP code (hashed or plain — matches Laravel's plain storage) */
    private String otp;

    @Column(name = "otp_expires_at")
    private LocalDateTime otpExpiresAt;

    @Column(name = "remember_token")
    private String rememberToken;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    private List<Note> notes;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public boolean isEmailVerified() {
        return emailVerifiedAt != null;
    }

    public String generateOtp() {
        int code = (int) (Math.random() * 1000000);
        String formattedOtp = String.format("%06d", code);
        this.otp = formattedOtp;
        this.otpExpiresAt = LocalDateTime.now().plusMinutes(5);
        return formattedOtp;
    }

    public boolean verifyOtp(String code) {
        return code != null && code.equals(this.otp) 
                && this.otpExpiresAt != null 
                && this.otpExpiresAt.isAfter(LocalDateTime.now());
    }

    public void clearOtp() {
        this.otp = null;
        this.otpExpiresAt = null;
    }
}
