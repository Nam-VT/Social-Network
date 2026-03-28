package com.vtn.social_network.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@social-network.local}")
    private String fromEmail;

    /**
     * Gửi email reset password.
     * Local: luôn log link ra console.
     * Deploy: gửi email thật nếu SMTP được cấu hình.
     */
    public void sendResetPasswordEmail(String toEmail, String resetToken) {
        String resetLink = "http://localhost:3000/reset-password?token=" + resetToken;

        // Luôn log ra console để test local
        log.info("========== RESET PASSWORD ==========");
        log.info("To: {}", toEmail);
        log.info("Link: {}", resetLink);
        log.info("====================================");

        // Thử gửi email thật
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Social Network - Đặt lại mật khẩu");
            message.setText("Xin chào,\n\n"
                    + "Bạn đã yêu cầu đặt lại mật khẩu.\n"
                    + "Nhấn vào link bên dưới để đặt mật khẩu mới (hết hạn sau 15 phút):\n\n"
                    + resetLink + "\n\n"
                    + "Nếu bạn không yêu cầu, hãy bỏ qua email này.\n\n"
                    + "Trân trọng,\nSocial Network Team");
            mailSender.send(message);
            log.info("Email đã được gửi thành công tới: {}", toEmail);
        } catch (Exception e) {
            log.warn("Không thể gửi email (SMTP chưa cấu hình?): {}. Link đã được log ở trên.", e.getMessage());
        }
    }
}
