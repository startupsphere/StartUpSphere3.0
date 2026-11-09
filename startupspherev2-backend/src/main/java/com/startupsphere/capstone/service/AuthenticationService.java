package com.startupsphere.capstone.service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.startupsphere.capstone.dtos.LoginUserDto;
import com.startupsphere.capstone.dtos.RegisterUserDto;
import com.startupsphere.capstone.entity.User;
import com.startupsphere.capstone.repository.UserRepository;

@Service
public class AuthenticationService {
    private static final Logger logger = LoggerFactory.getLogger(AuthenticationService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    public AuthenticationService(
        UserRepository userRepository,
        AuthenticationManager authenticationManager,
        PasswordEncoder passwordEncoder,
        EmailService emailService
    ) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    public User signup(RegisterUserDto input) {
        // Check if email already exists
        if (userRepository.findFirstByEmailIgnoreCase(input.getEmail()).isPresent()
                || userRepository.findFirstByEmail(input.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }
        
        String role = input.getRole() != null ? input.getRole() : "ROLE_USER"; // Default role is USER
    
        User user = new User()
                .setFirstname(input.getFirstname())
                .setLastname(input.getLastname())
                .setEmail(input.getEmail())
                .setPassword(passwordEncoder.encode(input.getPassword()))
                .setRole(role);
    
        return userRepository.save(user);
    }

    public User authenticate(LoginUserDto input) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        input.getEmail(),
                        input.getPassword()
                )
        );

        return userRepository.findFirstByEmailIgnoreCase(input.getEmail())
                .or(() -> userRepository.findFirstByEmail(input.getEmail()))
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    /**
     * Step 1: Confirm user exists, generate 6-digit code, and send verification email.
     * Safely handles duplicate email entries in the database to prevent NonUniqueResultException.
     */
    public void initiateForgotPassword(String email) {
        if (email == null || email.trim().isBlank()) {
            throw new IllegalArgumentException("Email address is required.");
        }

        String normalizedEmail = email.trim().toLowerCase();
        List<User> users = userRepository.findAllByEmailIgnoreCase(normalizedEmail);
        if (users.isEmpty()) {
            users = userRepository.findAllByEmail(email.trim());
        }
        if (users.isEmpty()) {
            throw new RuntimeException("No account found associated with this email address.");
        }

        SecureRandom secureRandom = new SecureRandom();
        String code = String.format("%06d", 100000 + secureRandom.nextInt(900000));
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(10);

        for (User u : users) {
            u.setResetPasswordCode(code);
            u.setResetPasswordCodeExpiresAt(expiresAt);
            userRepository.save(u);
        }

        User primaryUser = users.get(0);
        logger.info("Generated password reset code for {} account(s) matching: {}", users.size(), normalizedEmail);
        emailService.sendPasswordResetEmail(primaryUser.getEmail(), primaryUser.getFirstname(), code);
    }

    /**
     * Step 2: Validate verification code sent to user's email.
     */
    public void verifyResetCode(String email, String code) {
        if (email == null || email.trim().isBlank()) {
            throw new IllegalArgumentException("Email address is required.");
        }
        if (code == null || code.trim().isBlank()) {
            throw new IllegalArgumentException("Verification code is required.");
        }

        String normalizedEmail = email.trim().toLowerCase();
        List<User> users = userRepository.findAllByEmailIgnoreCase(normalizedEmail);
        if (users.isEmpty()) {
            users = userRepository.findAllByEmail(email.trim());
        }
        if (users.isEmpty()) {
            throw new RuntimeException("No account found with this email address.");
        }

        boolean hasValidCode = users.stream().anyMatch(u ->
            u.getResetPasswordCode() != null &&
            u.getResetPasswordCode().trim().equals(code.trim()) &&
            u.getResetPasswordCodeExpiresAt() != null &&
            !u.getResetPasswordCodeExpiresAt().isBefore(LocalDateTime.now())
        );

        if (!hasValidCode) {
            throw new RuntimeException("Invalid or expired verification code. Please request a new code.");
        }
    }

    /**
     * Step 3: Verify code and update password.
     */
    public void resetPassword(String email, String code, String newPassword) {
        verifyResetCode(email, code);

        if (newPassword == null || newPassword.length() < 6) {
            throw new IllegalArgumentException("New password must be at least 6 characters long.");
        }

        String normalizedEmail = email.trim().toLowerCase();
        List<User> users = userRepository.findAllByEmailIgnoreCase(normalizedEmail);
        if (users.isEmpty()) {
            users = userRepository.findAllByEmail(email.trim());
        }
        if (users.isEmpty()) {
            throw new RuntimeException("User not found");
        }

        String encodedPassword = passwordEncoder.encode(newPassword);
        for (User u : users) {
            u.setPassword(encodedPassword);
            u.setResetPasswordCode(null);
            u.setResetPasswordCodeExpiresAt(null);
            userRepository.save(u);
        }

        logger.info("Successfully updated password for {} account(s) with email: {}", users.size(), normalizedEmail);
    }
}
