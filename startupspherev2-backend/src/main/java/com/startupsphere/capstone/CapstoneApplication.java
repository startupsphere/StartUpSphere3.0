package com.startupsphere.capstone;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@EnableCaching
public class    CapstoneApplication {

    public static void main(String[] args) {
        // Load environment variables from .env or system environment
        Dotenv dotenv = Dotenv.configure()
                .ignoreIfMissing()
                .load();
        setSystemProperty(dotenv, "SENDGRID_API_KEY", "SENDGRID_API_KEY");
        setSystemProperty(dotenv, "SPRING_DATASOURCE_URL", "spring.datasource.url");
        setSystemProperty(dotenv, "SPRING_DATASOURCE_USERNAME", "spring.datasource.username");
        setSystemProperty(dotenv, "SPRING_DATASOURCE_PASSWORD", "spring.datasource.password");
        setSystemProperty(dotenv, "SECURITY_JWT_SECRET_KEY", "security.jwt.secret-key");

        SpringApplication.run(CapstoneApplication.class, args);
        System.out.println("Running");
    }

    private static void setSystemProperty(Dotenv dotenv, String dotenvKey, String systemPropertyKey) {
        String value = dotenv.get(dotenvKey, System.getenv(dotenvKey) != null ? System.getenv(dotenvKey) : null);
        if (value != null && !value.isBlank()) {
            System.setProperty(systemPropertyKey, value);
        }
    }

}