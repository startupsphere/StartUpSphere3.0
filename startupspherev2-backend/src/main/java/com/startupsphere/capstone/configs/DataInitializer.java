package com.startupsphere.capstone.configs;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
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
    private final JdbcTemplate jdbcTemplate;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder, JdbcTemplate jdbcTemplate) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostConstruct
    public void initializeAdminAccount() {
        String adminEmail = "admin@startupsphere.com";

        try {
            // Schema repairs for PostgreSQL bytea mapping issues (only convert if type is bytea)
            try {
                jdbcTemplate.execute("DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='startups' AND column_name='company_name' AND data_type='bytea') THEN ALTER TABLE startups ALTER COLUMN company_name TYPE VARCHAR(255) USING convert_from(company_name, 'UTF8'); END IF; END $$;");
                jdbcTemplate.execute("DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='startups' AND column_name='company_description' AND data_type='bytea') THEN ALTER TABLE startups ALTER COLUMN company_description TYPE TEXT USING convert_from(company_description, 'UTF8'); END IF; END $$;");
                jdbcTemplate.execute("DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='startups' AND column_name='location_name' AND data_type='bytea') THEN ALTER TABLE startups ALTER COLUMN location_name TYPE VARCHAR(255) USING convert_from(location_name, 'UTF8'); END IF; END $$;");
            } catch (Exception ex) {
                log.warn("Schema repair check skipped: {}", ex.getMessage());
            }

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