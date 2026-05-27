package com.startupsphere.capstone;

import java.io.IOException;
import java.net.ServerSocket;
import java.security.SecureRandom;
import java.util.Base64;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableScheduling;

import io.github.cdimascio.dotenv.Dotenv;

@SpringBootApplication
@EnableScheduling
@EnableCaching
public class    CapstoneApplication {

    public static void main(String[] args) {
        // Load environment variables from .env or system environment
        Dotenv dotenv = Dotenv.configure()
                .ignoreIfMissing()
                .load();
        setSystemProperty(dotenv, "SENDGRID_API_KEY", "sendgrid.api.key");
        setSystemProperty(dotenv, "SPRING_DATASOURCE_URL", "spring.datasource.url");
        setSystemProperty(dotenv, "SPRING_DATASOURCE_USERNAME", "spring.datasource.username");
        setSystemProperty(dotenv, "SPRING_DATASOURCE_PASSWORD", "spring.datasource.password");
        setSystemProperty(dotenv, "SECURITY_JWT_SECRET_KEY", "security.jwt.secret-key");

        // Ensure server port is available for local dev; pick a free port if the configured one is in use.
        ensureServerPortAvailable();

        SpringApplication.run(CapstoneApplication.class, args);
        System.out.println("Running");
    }

    private static void ensureServerPortAvailable() {
        String portProp = System.getProperty("server.port");
        int desiredPort = 8080;
        try {
            if (portProp != null && !portProp.isBlank()) {
                desiredPort = Integer.parseInt(portProp);
            }
        } catch (NumberFormatException ex) {
            desiredPort = 8080;
        }

        try (ServerSocket ss = new ServerSocket(desiredPort)) {
            ss.setReuseAddress(true);
            // port is available, close and continue
        } catch (IOException e) {
            // desired port is in use — find a free port and set `server.port`
            try (ServerSocket free = new ServerSocket(0)) {
                int freePort = free.getLocalPort();
                System.setProperty("server.port", String.valueOf(freePort));
                System.out.println("[INFO] Port " + desiredPort + " is in use; starting on available port " + freePort);
            } catch (IOException ex) {
                // ignore — let Spring fail with its normal message
            }
        }
    }

    private static void setSystemProperty(Dotenv dotenv, String dotenvKey, String systemPropertyKey) {
        String value = dotenv.get(dotenvKey);
        if (value == null || value.isBlank()) {
            value = System.getenv(dotenvKey);
        }
        if (value != null && !value.isBlank()) {
            System.setProperty(systemPropertyKey, value);
        } else if ("security.jwt.secret-key".equals(systemPropertyKey)) {
            // Generate a random 256-bit (32-byte) key and expose it as a base64 string for dev runs.
            byte[] key = new byte[32];
            new SecureRandom().nextBytes(key);
            String generated = Base64.getEncoder().encodeToString(key);
            System.setProperty(systemPropertyKey, generated);
            System.out.println("[INFO] No JWT secret provided; generated dev secret for security.jwt.secret-key");
        } else if ("spring.datasource.url".equals(systemPropertyKey)) {
            // Use an in-memory H2 database for local development when no datasource URL provided.
            String h2Url = "jdbc:h2:mem:startupsphere;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE";
            System.setProperty(systemPropertyKey, h2Url);
            // Set a sensible driver if not provided elsewhere
            if (System.getProperty("spring.datasource.driver-class-name") == null) {
                System.setProperty("spring.datasource.driver-class-name", "org.h2.Driver");
            }
            // Ensure a username/password exist for H2
            if (System.getProperty("spring.datasource.username") == null) {
                System.setProperty("spring.datasource.username", "sa");
            }
            if (System.getProperty("spring.datasource.password") == null) {
                System.setProperty("spring.datasource.password", "");
            }
            System.out.println("[INFO] No datasource URL provided; using in-memory H2 for development (spring.datasource.url)");
        } else if ("spring.datasource.username".equals(systemPropertyKey)) {
            // default username for H2
            System.setProperty(systemPropertyKey, "sa");
        } else if ("spring.datasource.password".equals(systemPropertyKey)) {
            // default empty password for H2
            System.setProperty(systemPropertyKey, "");
        }
    }

}