package com.startupsphere.capstone.configs;

import com.startupsphere.capstone.entity.User;
import com.startupsphere.capstone.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;

@Component
public class DataInitializer {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostConstruct
    public void initializeAdminAccount() {
        String adminEmail = "admin@startupsphere.com";

        // Check if an admin account already exists
        if (userRepository.findByEmail(adminEmail).isEmpty()) {
            User admin = new User()
                    .setFirstname("Admin")
                    .setLastname("User")
                    .setEmail(adminEmail)
                    .setPassword(passwordEncoder.encode("admin123")) // Default password
                    .setRole("ROLE_ADMIN");

            userRepository.save(admin);
            System.out.println("Admin account created with email: " + adminEmail);
        } else {
            System.out.println("Admin account already exists.");
        }
    }
}