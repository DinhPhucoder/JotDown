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

    public MailService(
            @Value("${app.resend.api-key}") String apiKey,
            @Value("${app.resend.from-address}") String fromAddress) {
        this.fromAddress = fromAddress;
        this.restClient = RestClient.builder()
                .baseUrl("https://api.resend.com")
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .defaultHeader("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    public void sendOtpMail(String toEmail, String otp, String purpose) {
        String subject = "Mã xác thực JotDown";
        String actionText = "verify".equalsIgnoreCase(purpose) ? "xác thực email" : "đặt lại mật khẩu";
        
        String content = "<h1>Mã xác thực của bạn</h1>"
                + "<p>Sử dụng mã OTP sau để " + actionText + " (có hiệu lực trong 5 phút):</p>"
                + "<h2 style=\"background: #f4f4f4; padding: 10px; display: inline-block;\">" + otp + "</h2>";
                
        sendEmail(toEmail, subject, content);
    }

    public void sendVerifyEmailMail(String toEmail, String signedUrl) {
        String subject = "Xác thực địa chỉ email JotDown";
        
        String content = "<h1>Xác thực email của bạn</h1>"
                + "<p>Vui lòng click vào link bên dưới để xác thực email của bạn (có hiệu lực trong 60 phút):</p>"
                + "<p><a href=\"" + signedUrl + "\">Xác thực Email</a></p>";
                
        sendEmail(toEmail, subject, content);
    }

    public void sendNoteSharedMail(Note note, User sender, User receiver, String permission) {
        String subject = sender.getName() + " đã chia sẻ một ghi chú với bạn";
        String permText = "EDIT".equalsIgnoreCase(permission) ? "chỉnh sửa" : "xem";
        
        String content = "<h1>Ghi chú mới được chia sẻ</h1>"
                + "<p><strong>" + sender.getName() + "</strong> vừa chia sẻ ghi chú <strong>" + note.getTitle() + "</strong> với bạn.</p>"
                + "<p>Bạn có quyền <strong>" + permText + "</strong> trên ghi chú này.</p>"
                + "<p><a href=\"http://localhost:5173/notes/" + note.getId() + "\">Mở ghi chú ngay</a></p>";
                
        sendEmail(receiver.getEmail(), subject, content);
    }

    private void sendEmail(String to, String subject, String htmlContent) {
        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("from", fromAddress);
            requestBody.put("to", new String[]{to});
            requestBody.put("subject", subject);
            requestBody.put("html", htmlContent);

            restClient.post()
                    .uri("/emails")
                    .body(requestBody)
                    .retrieve()
                    .toBodilessEntity();
                    
            log.info("Sent email to: {} with subject: {}", to, subject);
        } catch (HttpStatusCodeException e) {
            log.error("Resend API returned error status: {}. Response body: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("Không thể gửi email qua Resend API: " + e.getResponseBodyAsString(), e);
        } catch (Exception e) {
            log.error("Failed to send email to {} via Resend HTTP API. Subject: {}. Error: {}", to, subject, e.getMessage(), e);
            throw new RuntimeException("Gửi email thất bại: " + e.getMessage(), e);
        }
    }
}
