package com.jotdown.api.service;

import com.jotdown.api.entity.Note;
import com.jotdown.api.entity.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClient;

import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class MailService {

    private final RestClient restClient;
    private final String fromAddress;
    private final String frontendUrl;

    public MailService(
            @Value("${app.resend.api-key}") String apiKey,
            @Value("${app.resend.from-address}") String fromAddress,
            @Value("${app.frontend-url}") String frontendUrl) {
        this.fromAddress = fromAddress;
        this.frontendUrl = frontendUrl;
        this.restClient = RestClient.builder()
                .baseUrl("https://api.resend.com")
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .defaultHeader("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    // ─────────────────────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────────────────────

    public void sendOtpMail(String toEmail, String otp, String purpose) {
        String subject = "Mã xác thực JotDown";
        String actionText = "verify".equalsIgnoreCase(purpose) ? "xác thực email" : "đặt lại mật khẩu";
        sendEmail(toEmail, subject, buildOtpTemplate(otp, actionText));
    }

    public void sendVerifyEmailMail(String toEmail, String signedUrl) {
        String subject = "Xác thực địa chỉ email JotDown";
        sendEmail(toEmail, subject, buildVerifyEmailTemplate(signedUrl));
    }

    public void sendNoteSharedMail(Note note, User sender, User receiver, String permission) {
        String subject = sender.getName() + " đã chia sẻ một ghi chú với bạn";
        String permText = "EDIT".equalsIgnoreCase(permission) ? "Quyền chỉnh sửa" : "Quyền xem";
        String badgeStyle = "EDIT".equalsIgnoreCase(permission)
                ? "background:rgba(11,92,255,0.1);color:#1d4ed8;"
                : "background:rgba(100,116,139,0.1);color:#475569;";
        String noteUrl = frontendUrl + "/login";
        sendEmail(receiver.getEmail(), subject,
                buildNoteSharedTemplate(note.getTitle(), sender.getName(), sender.getEmail(), permText, badgeStyle,
                        noteUrl));
    }

    // ─────────────────────────────────────────────────────────────
    // HTML Template Builders — CSS inlined for email client compat
    // ─────────────────────────────────────────────────────────────

    private String buildOtpTemplate(String otp, String actionText) {
        String body = "<p style=\"font-size:1.3rem;font-weight:700;color:#0f172a;margin:0 0 12px 0;\">Mã xác thực của bạn</p>"
                +
                "<p style=\"font-size:0.9rem;line-height:1.75;color:#475569;margin:0 0 16px 0;\">Chúng tôi nhận được yêu cầu <strong>"
                + actionText + "</strong> cho tài khoản của bạn. Vui lòng sử dụng mã OTP bên dưới để tiếp tục:</p>" +
                "<div style=\"background:linear-gradient(135deg,#eff6ff,#f5f3ff);border:1.5px solid rgba(11,92,255,0.15);border-radius:12px;padding:28px;text-align:center;margin:28px 0;\">"
                +
                "<div style=\"font-size:0.75rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#64748b;margin-bottom:16px;\">Mã xác thực (OTP)</div>"
                +
                "<div style=\"font-size:3rem;font-weight:800;letter-spacing:0.25em;color:#0b5cff;\">" + otp + "</div>" +
                "<div style=\"font-size:0.78rem;color:#94a3b8;margin-top:10px;\">Có hiệu lực trong <span style=\"color:#f97316;font-weight:600;\">5 phút</span> &nbsp;&middot;&nbsp; Không chia sẻ mã này với bất kỳ ai</div>"
                +
                "</div>" +
                "<p style=\"font-size:0.9rem;line-height:1.75;color:#475569;margin:0 0 16px 0;\">Nếu bạn không yêu cầu thao tác này, bạn có thể bỏ qua email này một cách an toàn. Tài khoản của bạn vẫn được bảo mật.</p>"
                +
                "<div style=\"background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px 18px;font-size:0.78rem;color:#92400e;line-height:1.6;margin:24px 0;\">"
                +
                "JotDown <strong>sẽ không bao giờ</strong> yêu cầu bạn cung cấp mã OTP qua điện thoại, email hay tin nhắn khác. Cảnh giác với các hành vi lừa đảo."
                +
                "</div>";
        return wrapInLayout(body);
    }

    private String buildVerifyEmailTemplate(String verifyUrl) {
        String body = "<p style=\"font-size:1.3rem;font-weight:700;color:#0f172a;margin:0 0 12px 0;\">Chào mừng bạn đến với JotDown!</p>"
                +
                "<p style=\"font-size:0.9rem;line-height:1.75;color:#475569;margin:0 0 16px 0;\">Cảm ơn bạn đã tạo tài khoản tại JotDown. Chỉ còn một bước nữa để bắt đầu!</p>"
                +
                "<p style=\"font-size:0.9rem;line-height:1.75;color:#475569;margin:0 0 16px 0;\">Vui lòng xác thực địa chỉ email của bạn bằng cách nhấn vào nút bên dưới. Liên kết này có hiệu lực trong <strong>60 phút</strong>.</p>"
                +
                "<div style=\"text-align:center;margin:32px 0;\">" +
                "<a href=\"" + verifyUrl
                + "\" style=\"display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#0b5cff 0%,#1f58ff 45%,#7c3aed 100%);color:#ffffff;text-decoration:none;border-radius:6px;font-size:0.9rem;font-weight:600;\">Xác thực Email của tôi</a>"
                +
                "</div>" +
                "<div style=\"height:1px;background:#e2e8f0;margin:28px 0;\"></div>" +
                "<div style=\"background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px 18px;font-size:0.78rem;color:#92400e;line-height:1.6;margin:24px 0;\">"
                +
                "Nếu bạn không đăng ký tài khoản JotDown, vui lòng bỏ qua email này. Không có hành động nào được yêu cầu từ phía bạn."
                +
                "</div>";
        return wrapInLayout(body);
    }

    private String buildNoteSharedTemplate(String noteTitle, String senderName, String senderEmail, String permText,
            String badgeStyle, String noteUrl) {
        String body = "<p style=\"font-size:1.3rem;font-weight:700;color:#0f172a;margin:0 0 12px 0;\">Bạn có một ghi chú mới!</p>"
                +
                "<p style=\"font-size:0.9rem;line-height:1.75;color:#475569;margin:0 0 16px 0;\"><strong>" + senderName
                + "</strong> (" + senderEmail + ") vừa chia sẻ một ghi chú với bạn trên JotDown.</p>" +
                "<div style=\"background:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid #0b5cff;border-radius:0 8px 8px 0;padding:20px 24px;margin:24px 0;\">"
                +
                "<div style=\"font-size:0.95rem;font-weight:700;color:#0f172a;margin-bottom:8px;\">" + noteTitle
                + "</div>" +
                "<span style=\"display:inline-block;padding:3px 12px;border-radius:20px;font-size:0.72rem;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;"
                + badgeStyle + "\">" + permText + "</span>" +
                "</div>" +
                "<p style=\"font-size:0.9rem;line-height:1.75;color:#475569;margin:0 0 16px 0;\">Nhấn vào nút bên dưới để xem ghi chú này:</p>"
                +
                "<div style=\"text-align:center;margin:32px 0;\">" +
                "<a href=\"" + noteUrl
                + "\" style=\"display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#0b5cff 0%,#1f58ff 45%,#7c3aed 100%);color:#ffffff;text-decoration:none;border-radius:6px;font-size:0.9rem;font-weight:600;\">Mở ghi chú ngay</a>"
                +
                "</div>";
        return wrapInLayout(body);
    }

    /**
     * Wraps body content with shared header + footer layout from
     * template_mail.html.
     * Uses table-based layout and inline CSS for maximum email client
     * compatibility.
     */
    private String wrapInLayout(String bodyContent) {
        return "<!DOCTYPE html><html lang=\"vi\"><head><meta charset=\"UTF-8\" /><title>JotDown</title></head>" +
                "<body style=\"margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background:#e8eaf0;color:#0f172a;\">"
                +
                "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" bgcolor=\"#e8eaf0\"><tr><td align=\"center\" style=\"padding:40px 20px;\">"
                +
                "<table width=\"600\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;\">"
                +

                // Header
                "<tr><td style=\"background:linear-gradient(135deg,#041a3b 0%,#0c2f63 42%,#281a5f 75%,#4b1d79 100%);padding:36px 48px 32px;text-align:center;\">"
                +
                "<div style=\"font-size:1.5rem;font-weight:800;color:#ffffff;margin-bottom:6px;\">JotDown</div>" +
                "<div style=\"font-size:0.78rem;color:rgba(255,255,255,0.5);letter-spacing:0.08em;text-transform:uppercase;\">Ghi chú thông minh</div>"
                +
                "</td></tr>" +

                // Body
                "<tr><td style=\"padding:40px 48px;\">" + bodyContent + "</td></tr>" +

                // Footer
                "<tr><td style=\"background:#f8fafc;border-top:1px solid #f1f5f9;padding:24px 48px;text-align:center;\">"
                +
                "<div style=\"font-size:0.95rem;font-weight:700;color:#0b5cff;margin-bottom:8px;\">JotDown</div>" +
                "<div style=\"font-size:0.73rem;color:#94a3b8;line-height:1.7;\">" +
                "Email này được gửi tự động &middot; Vui lòng không trả lời email này<br/>" +
                "&copy; 2026 JotDown. All rights reserved." +
                "</div>" +
                "</td></tr>" +

                "</table></td></tr></table></body></html>";
    }

    // ─────────────────────────────────────────────────────────────
    // Send via Resend HTTP API
    // ─────────────────────────────────────────────────────────────

    private void sendEmail(String to, String subject, String htmlContent) {
        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("from", fromAddress);
            requestBody.put("to", new String[] { to });
            requestBody.put("subject", subject);
            requestBody.put("html", htmlContent);

            restClient.post()
                    .uri("/emails")
                    .body(requestBody)
                    .retrieve()
                    .toBodilessEntity();

            log.info("Sent email to: {} with subject: {}", to, subject);
        } catch (HttpStatusCodeException e) {
            log.error("Resend API returned error status: {}. Response body: {}", e.getStatusCode(),
                    e.getResponseBodyAsString());
            throw new RuntimeException("Không thể gửi email qua Resend API: " + e.getResponseBodyAsString(), e);
        } catch (Exception e) {
            log.error("Failed to send email to {} via Resend HTTP API. Subject: {}. Error: {}", to, subject,
                    e.getMessage(), e);
            throw new RuntimeException("Gửi email thất bại: " + e.getMessage(), e);
        }
    }
}
