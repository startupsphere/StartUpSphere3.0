package com.startupsphere.capstone.service;

import java.io.IOException;
import java.util.Properties;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import com.sendgrid.Method;
import com.sendgrid.Request;
import com.sendgrid.Response;
import com.sendgrid.SendGrid;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;

import io.github.cdimascio.dotenv.Dotenv;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    @Value("${spring.mail.from:}")
    private String mailFrom;

    @Value("${sendgrid.api.key:}")
    private String sendgridApiKey;

    @Value("${sendgrid.from.email:default@startupsphere.com}")
    private String sendgridFromEmail;

    @Value("${sendgrid.from.name:StartupSphere}")
    private String sendgridFromName;

    private synchronized JavaMailSender getOrCreateMailSender() {
        if (mailSender != null) {
            return mailSender;
        }
        String username = getEffectiveUsername();
        String password = getEffectivePassword();
        if (username != null && !username.isBlank() && password != null && !password.isBlank()) {
            JavaMailSenderImpl impl = new JavaMailSenderImpl();
            impl.setHost("smtp.gmail.com");
            impl.setPort(587);
            impl.setUsername(username);
            impl.setPassword(password);

            Properties props = impl.getJavaMailProperties();
            props.put("mail.transport.protocol", "smtp");
            props.put("mail.smtp.auth", "true");
            props.put("mail.smtp.starttls.enable", "true");
            props.put("mail.smtp.starttls.required", "true");
            props.put("mail.smtp.ssl.trust", "smtp.gmail.com");
            props.put("mail.smtp.connectiontimeout", "10000");
            props.put("mail.smtp.timeout", "10000");
            props.put("mail.smtp.writetimeout", "10000");
            this.mailSender = impl;
            return impl;
        }
        return null;
    }

    public String getEffectiveUsername() {
        if (mailUsername != null && !mailUsername.isBlank()) {
            return mailUsername.trim();
        }
        String val = System.getProperty("spring.mail.username");
        if (val != null && !val.isBlank()) return val.trim();
        val = System.getenv("MAIL_USERNAME");
        if (val != null && !val.isBlank()) return val.trim();
        try {
            Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
            val = dotenv.get("MAIL_USERNAME");
            if (val != null && !val.isBlank()) return val.trim();
        } catch (Exception ignored) {}
        return "cabigasanrey@gmail.com";
    }

    public String getEffectivePassword() {
        if (mailPassword != null && !mailPassword.isBlank()) {
            return mailPassword.replace(" ", "").trim();
        }
        String val = System.getProperty("spring.mail.password");
        if (val != null && !val.isBlank()) return val.replace(" ", "").trim();
        val = System.getenv("MAIL_PASSWORD");
        if (val != null && !val.isBlank()) return val.replace(" ", "").trim();
        try {
            Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
            val = dotenv.get("MAIL_PASSWORD");
            if (val != null && !val.isBlank()) return val.replace(" ", "").trim();
        } catch (Exception ignored) {}
        return "ipttavepjcgreujc";
    }

    /**
     * Checks if a live mail provider (Gmail SMTP or SendGrid) is properly configured.
     */
    public boolean isMailConfigured() {
        String username = getEffectiveUsername();
        String password = getEffectivePassword();
        boolean hasGmail = (username != null && !username.isBlank() && password != null && !password.isBlank());
        boolean hasSendgrid = (sendgridApiKey != null && !sendgridApiKey.isBlank() && !sendgridApiKey.equals("SG.placeholder"));
        return hasGmail || hasSendgrid;
    }

    /**
     * Send OTP verification email to verify the business contact email.
     * Connects directly to Gmail SMTP and sends the email to the recipient's inbox.
     */
    public boolean sendOtpVerificationEmail(String toEmail, String companyName, String otpCode) {
        logger.info("Initiating OTP verification email to: {} for startup: {}", toEmail, companyName);

        String subject = "Verify Your Business Email - StartupSphere";
        String htmlBody = buildOtpHtmlContent(companyName, otpCode);
        String textBody = "Hello " + (companyName != null && !companyName.isBlank() ? companyName : "there") + ",\n\n"
                + "Your one-time verification code for StartupSphere is: " + otpCode + "\n\n"
                + "Please enter this code in StartupSphere to verify your business email address.\n"
                + "This code is valid for 10 minutes.\n\n"
                + "If you did not request this, please ignore this email.\n\n"
                + "Best regards,\nStartupSphere Team";

        // 1. Send via Gmail SMTP
        JavaMailSender sender = getOrCreateMailSender();
        if (sender != null) {
            try {
                MimeMessage message = sender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

                String senderAddress = (mailFrom != null && !mailFrom.isBlank()) ? mailFrom : getEffectiveUsername();
                helper.setFrom(senderAddress, "StartupSphere");
                helper.setTo(toEmail);
                helper.setSubject(subject);
                helper.setText(textBody, htmlBody);

                sender.send(message);
                logger.info("Successfully delivered OTP verification email via Gmail SMTP to {}", toEmail);
                return true;
            } catch (Exception e) {
                logger.error("Failed to send OTP email via Gmail SMTP to {}: {}", toEmail, e.getMessage(), e);
                throw new RuntimeException("Failed to send email via Gmail: " + e.getMessage(), e);
            }
        }

        // 2. Try SendGrid if configured
        if (sendgridApiKey != null && !sendgridApiKey.isBlank() && !sendgridApiKey.equals("SG.placeholder")) {
            try {
                Email from = new Email(sendgridFromEmail, sendgridFromName);
                Email to = new Email(toEmail);
                Content content = new Content("text/html", htmlBody);
                Mail mail = new Mail(from, subject, to, content);

                SendGrid sg = new SendGrid(sendgridApiKey);
                Request request = new Request();
                request.setMethod(Method.POST);
                request.setEndpoint("mail/send");
                request.setBody(mail.build());

                Response response = sg.api(request);
                if (response.getStatusCode() >= 200 && response.getStatusCode() < 300) {
                    logger.info("Successfully sent OTP verification email via SendGrid to {}", toEmail);
                    return true;
                } else {
                    logger.error("SendGrid failed with status {}: {}", response.getStatusCode(), response.getBody());
                    throw new RuntimeException("Failed to send email via SendGrid: HTTP " + response.getStatusCode());
                }
            } catch (IOException e) {
                logger.error("IOException with SendGrid for {}: {}", toEmail, e.getMessage(), e);
                throw new RuntimeException("Failed to send email: " + e.getMessage(), e);
            }
        }

        throw new RuntimeException("No working mail provider configured. Could not send verification code.");
    }

    /**
     * Send update reminder email to a startup.
     */
    public boolean sendReminderEmail(String toEmail, String companyName) {
        String subject = "Reminder: Update Your Startup Information - StartupSphere";
        String htmlBody = "<div style=\"font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px;\">"
                + "<h2 style=\"color: #1D3557;\">Update Your Startup Information</h2>"
                + "<p>Dear <strong>" + (companyName != null ? companyName : "Startup") + "</strong>,</p>"
                + "<p>It has been over 6 months since your startup profile was last updated. To keep your information verified and visible to investors, please log in and update your details.</p>"
                + "<p style=\"margin-top: 32px; font-size: 13px; color: #64748b;\">StartupSphere Team</p>"
                + "</div>";

        String textBody = "Dear " + (companyName != null ? companyName : "Startup") + ",\n\n"
                + "It has been over 6 months since your startup information was last updated. "
                + "Please log in to your account and visit the dashboard to review and update your information.\n\n"
                + "Thank you,\nStartupSphere Team";

        // Try Gmail SMTP
        if (mailSender != null && mailUsername != null && !mailUsername.isBlank()) {
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
                String senderAddress = (mailFrom != null && !mailFrom.isBlank()) ? mailFrom : mailUsername;
                helper.setFrom(senderAddress, "StartupSphere");
                helper.setTo(toEmail);
                helper.setSubject(subject);
                helper.setText(textBody, htmlBody);
                mailSender.send(message);
                return true;
            } catch (Exception e) {
                logger.error("Failed to send reminder email via Gmail SMTP: {}", e.getMessage(), e);
            }
        }

        // Try SendGrid
        if (sendgridApiKey != null && !sendgridApiKey.isBlank() && !sendgridApiKey.equals("SG.placeholder")) {
            try {
                Email from = new Email(sendgridFromEmail, sendgridFromName);
                Email to = new Email(toEmail);
                Content content = new Content("text/plain", textBody);
                Mail mail = new Mail(from, subject, to, content);
                SendGrid sg = new SendGrid(sendgridApiKey);
                Request request = new Request();
                request.setMethod(Method.POST);
                request.setEndpoint("mail/send");
                request.setBody(mail.build());
                Response response = sg.api(request);
                return response.getStatusCode() >= 200 && response.getStatusCode() < 300;
            } catch (IOException e) {
                logger.error("SendGrid reminder failed: {}", e.getMessage(), e);
            }
        }

        return false;
    }

    private String buildOtpHtmlContent(String companyName, String otpCode) {
        String greetingName = (companyName != null && !companyName.isBlank()) ? companyName : "Founder";
        return "<!DOCTYPE html>"
                + "<html>"
                + "<head><meta charset=\"UTF-8\"><title>StartupSphere Verification Code</title></head>"
                + "<body style=\"margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;\">"
                + "<table align=\"center\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" style=\"max-width: 580px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0;\">"
                + "  <tr>"
                + "    <td style=\"background: linear-gradient(135deg, #1D3557 0%, #16324F 100%); padding: 32px 30px; text-align: center;\">"
                + "      <h1 style=\"color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;\">StartupSphere</h1>"
                + "      <p style=\"color: #93c5fd; margin: 6px 0 0 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;\">Business Email Verification</p>"
                + "    </td>"
                + "  </tr>"
                + "  <tr>"
                + "    <td style=\"padding: 36px 32px 24px 32px;\">"
                + "      <h2 style=\"color: #0f172a; margin: 0 0 14px 0; font-size: 20px; font-weight: 600;\">Verify your business email</h2>"
                + "      <p style=\"color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;\">"
                + "        Hello <strong>" + escapeHtml(greetingName) + "</strong>,<br><br>"
                + "        Thank you for submitting your business details. Please use the verification code below to verify your business email address and complete the submission:"
                + "      </p>"
                + "      <div style=\"text-align: center; margin: 28px 0; padding: 20px; background-color: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1;\">"
                + "        <span style=\"display: inline-block; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #1D3557; font-family: 'Courier New', Courier, monospace;\">" + otpCode + "</span>"
                + "        <div style=\"color: #64748b; font-size: 12px; margin-top: 8px;\">Code expires in 10 minutes</div>"
                + "      </div>"
                + "      <p style=\"color: #64748b; font-size: 14px; line-height: 1.5; margin: 20px 0 0 0;\">"
                + "        If you did not initiate this request or if you don't recognize this action, you can safely ignore this email."
                + "      </p>"
                + "    </td>"
                + "  </tr>"
                + "  <tr>"
                + "    <td style=\"background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center;\">"
                + "      <p style=\"color: #94a3b8; font-size: 12px; margin: 0;\">"
                + "        &copy; StartupSphere. All rights reserved."
                + "      </p>"
                + "    </td>"
                + "  </tr>"
                + "</table>"
                + "</body>"
                + "</html>";
    }

    private String escapeHtml(String input) {
        if (input == null) return "";
        return input.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#x27;");
    }
}
