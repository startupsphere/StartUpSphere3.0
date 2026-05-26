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
        String sendGridApiKey = dotenv.get("SENDGRID_API_KEY", System.getenv("SENDGRID_API_KEY") != null ? System.getenv("SENDGRID_API_KEY") : "");
        System.setProperty("SENDGRID_API_KEY", sendGridApiKey);

        SpringApplication.run(CapstoneApplication.class, args);
        System.out.println("Running");
    }

}