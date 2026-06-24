package com.jotdown.api.service;

import com.jotdown.api.entity.Note;
import com.jotdown.api.entity.User;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class MailService {

    private final JavaMailSender mailSender;

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
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            
            mailSender.send(message);
            log.info("Sent email to: {} with subject: {}", to, subject);
        } catch (Exception e) {
            log.error("Failed to send email to {}. Fallback to log. Subject: {}. Content: {}", to, subject, htmlContent, e);
        }
    }
}
