package com.startupsphere.capstone.configs;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.startupsphere.capstone.entity.User;
import com.startupsphere.capstone.repository.UserRepository;

import jakarta.annotation.PostConstruct;

@Component
public class DataInitializer {
    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostConstruct
    public void initializeAdminAccount() {
        String adminEmail = "admin@startupsphere.com";

        try {
            // Check if an admin account already exists
            if (userRepository.findByEmail(adminEmail).isEmpty()) {
                User admin = new User()
                        .setFirstname("Admin")
                        .setLastname("User")
                        .setEmail(adminEmail)
                        .setPassword(passwordEncoder.encode("admin123")) // Default password
                        .setRole("ROLE_ADMIN");

                userRepository.save(admin);
                log.info("Admin account created with email: {}", adminEmail);
            } else {
                log.info("Admin account already exists.");
            }
        } catch (Exception e) {
            // Likely database/table not yet present; log and skip initialization so app can continue
            log.warn("DataInitializer skipped due to database error: {}", e.getMessage());
        }
    }
}