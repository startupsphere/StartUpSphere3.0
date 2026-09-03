package com.startupsphere.capstone.configs;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.startupsphere.capstone.entity.Stakeholder;
import com.startupsphere.capstone.entity.Startup;
import com.startupsphere.capstone.entity.User;
import com.startupsphere.capstone.repository.StakeholderRepository;
import com.startupsphere.capstone.repository.StartupRepository;
import com.startupsphere.capstone.repository.UserRepository;

import jakarta.annotation.PostConstruct;

@Component
public class DataInitializer {
    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final StartupRepository startupRepository;
    private final StakeholderRepository stakeholderRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    public DataInitializer(
            UserRepository userRepository,
            StartupRepository startupRepository,
            StakeholderRepository stakeholderRepository,
            PasswordEncoder passwordEncoder,
            JdbcTemplate jdbcTemplate) {
        this.userRepository = userRepository;
        this.startupRepository = startupRepository;
        this.stakeholderRepository = stakeholderRepository;
        this.passwordEncoder = passwordEncoder;
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostConstruct
    public void initializeData() {
        String adminEmail = "admin@startupsphere.com";

        try {
            // Schema repairs for PostgreSQL bytea mapping issues
            try {
                jdbcTemplate.execute("DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='startups' AND column_name='company_name' AND data_type='bytea') THEN ALTER TABLE startups ALTER COLUMN company_name TYPE VARCHAR(255) USING convert_from(company_name, 'UTF8'); END IF; END $$;");
                jdbcTemplate.execute("DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='startups' AND column_name='company_description' AND data_type='bytea') THEN ALTER TABLE startups ALTER COLUMN company_description TYPE TEXT USING convert_from(company_description, 'UTF8'); END IF; END $$;");
                jdbcTemplate.execute("DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='startups' AND column_name='location_name' AND data_type='bytea') THEN ALTER TABLE startups ALTER COLUMN location_name TYPE VARCHAR(255) USING convert_from(location_name, 'UTF8'); END IF; END $$;");
            } catch (Exception ex) {
                log.warn("Schema repair check skipped: {}", ex.getMessage());
            }

            // Ensure Admin account exists
            User admin = userRepository.findByEmail(adminEmail).orElseGet(() -> {
                User newAdmin = new User()
                        .setFirstname("Admin")
                        .setLastname("User")
                        .setEmail(adminEmail)
                        .setPassword(passwordEncoder.encode("admin123"))
                        .setRole("ROLE_ADMIN");
                User saved = userRepository.save(newAdmin);
                log.info("Admin account created with email: {}", adminEmail);
                return saved;
            });

            // Seed initial startups if repository is empty
            if (startupRepository.count() == 0) {
                log.info("Startup database empty. Initializing sample approved startups...");

                Startup s1 = new Startup();
                s1.setUser(admin);
                s1.setCompanyName("PayMongo Hub");
                s1.setCompanyDescription("Digital payments infrastructure platform enabling businesses to seamlessly accept online payments across Southeast Asia.");
                s1.setFoundedDate("2021-03-15");
                s1.setTypeOfCompany("Technology / FinTech");
                s1.setNumberOfEmployees("20-50");
                s1.setPhoneNumber("+63 32 411 2000");
                s1.setContactEmail("contact@paymongo.hub");
                s1.setStreetAddress("Cebu IT Park, Lahug");
                s1.setCity("Cebu City");
                s1.setProvince("Cebu");
                s1.setRegion("Region VII (Central Visayas)");
                s1.setPostalCode("6000");
                s1.setIndustry("FinTech");
                s1.setWebsite("https://paymongo.hub");
                s1.setLocationLat(10.3266);
                s1.setLocationLng(123.9067);
                s1.setLocationName("Cebu IT Park, Lahug, Cebu City");
                s1.setStartupCode("SS-FIN-001");
                s1.setStatus("Approved");
                s1.setIsDraft(false);
                s1.setEmailVerified(true);
                s1.setTrlLevel("TRL 8");

                Startup s2 = new Startup();
                s2.setUser(admin);
                s2.setCompanyName("AgriGrow Visayas");
                s2.setCompanyDescription("Smart agricultural technology using IoT sensors and drone analytics for crop yield optimization and soil health monitoring.");
                s2.setFoundedDate("2022-01-10");
                s2.setTypeOfCompany("AgriTech");
                s2.setNumberOfEmployees("10-20");
                s2.setPhoneNumber("+63 32 345 8890");
                s2.setContactEmail("info@agrigrow.ph");
                s2.setStreetAddress("A.S. Fortuna St.");
                s2.setCity("Mandaue City");
                s2.setProvince("Cebu");
                s2.setRegion("Region VII (Central Visayas)");
                s2.setPostalCode("6014");
                s2.setIndustry("AgriTech");
                s2.setWebsite("https://agrigrow.ph");
                s2.setLocationLat(10.3421);
                s2.setLocationLng(123.9256);
                s2.setLocationName("Mandaue Business District, Mandaue City");
                s2.setStatus("Approved");
                s2.setIsDraft(false);
                s2.setEmailVerified(true);
                s2.setTrlLevel("TRL 7");

                Startup s3 = new Startup();
                s3.setUser(admin);
                s3.setCompanyName("MedPulse AI");
                s3.setCompanyDescription("AI-assisted clinical decision support and telemedicine platform bridging rural clinics with medical specialists.");
                s3.setFoundedDate("2020-11-05");
                s3.setTypeOfCompany("HealthTech");
                s3.setNumberOfEmployees("15-30");
                s3.setPhoneNumber("+63 32 253 1234");
                s3.setContactEmail("support@medpulse.ai");
                s3.setStreetAddress("Osmeña Blvd.");
                s3.setCity("Cebu City");
                s3.setProvince("Cebu");
                s3.setRegion("Region VII (Central Visayas)");
                s3.setPostalCode("6000");
                s3.setIndustry("HealthTech");
                s3.setWebsite("https://medpulse.ai");
                s3.setLocationLat(10.3112);
                s3.setLocationLng(123.8912);
                s3.setLocationName("Fuente Osmeña, Cebu City");
                s3.setStatus("Approved");
                s3.setIsDraft(false);
                s3.setEmailVerified(true);
                s3.setTrlLevel("TRL 9");

                Startup s4 = new Startup();
                s4.setUser(admin);
                s4.setCompanyName("EduSmart Philippines");
                s4.setCompanyDescription("Gamified adaptive learning platform tailored for K-12 STEM curriculum with localized Philippine languages.");
                s4.setFoundedDate("2023-04-18");
                s4.setTypeOfCompany("EdTech");
                s4.setNumberOfEmployees("5-15");
                s4.setPhoneNumber("+63 32 495 7711");
                s4.setContactEmail("hello@edusmart.ph");
                s4.setStreetAddress("Pajac Road");
                s4.setCity("Lapu-Lapu City");
                s4.setProvince("Cebu");
                s4.setRegion("Region VII (Central Visayas)");
                s4.setPostalCode("6015");
                s4.setIndustry("EdTech");
                s4.setWebsite("https://edusmart.ph");
                s4.setLocationLat(10.3050);
                s4.setLocationLng(123.9680);
                s4.setLocationName("Pajac, Lapu-Lapu City");
                s4.setStatus("Approved");
                s4.setIsDraft(false);
                s4.setEmailVerified(true);
                s4.setTrlLevel("TRL 8");

                Startup s5 = new Startup();
                s5.setUser(admin);
                s5.setCompanyName("EcoLoop Materials");
                s5.setCompanyDescription("Sustainable circular economy initiative upcycling post-consumer plastics into eco-friendly construction composites.");
                s5.setFoundedDate("2021-08-22");
                s5.setTypeOfCompany("CleanTech");
                s5.setNumberOfEmployees("10-25");
                s5.setPhoneNumber("+63 32 388 9911");
                s5.setContactEmail("contact@ecoloop.ph");
                s5.setStreetAddress("Gorordo Ave, Lahug");
                s5.setCity("Cebu City");
                s5.setProvince("Cebu");
                s5.setRegion("Region VII (Central Visayas)");
                s5.setPostalCode("6000");
                s5.setIndustry("CleanTech");
                s5.setWebsite("https://ecoloop.ph");
                s5.setLocationLat(10.3205);
                s5.setLocationLng(123.8980);
                s5.setLocationName("Lahug, Cebu City");
                s5.setStatus("Approved");
                s5.setIsDraft(false);
                s5.setEmailVerified(true);
                s5.setTrlLevel("TRL 7");

                startupRepository.saveAll(List.of(s1, s2, s3, s4, s5));
                log.info("Sample approved startups seeded successfully.");
            }

            // Seed initial stakeholders if empty
            if (stakeholderRepository.count() == 0) {
                log.info("Stakeholder database empty. Initializing sample stakeholders...");

                Stakeholder st1 = new Stakeholder();
                st1.setName("DOST Region VII Innovation Center");
                st1.setEmail("dost7@innovation.gov.ph");
                st1.setPhoneNumber("+63 32 418 9000");
                st1.setCity("Cebu City");
                st1.setProvince("Cebu");
                st1.setRegion("Region VII (Central Visayas)");
                st1.setLocationLat(10.3210);
                st1.setLocationLng(123.8980);
                st1.setLocationName("Sudlon, Lahug, Cebu City");

                Stakeholder st2 = new Stakeholder();
                st2.setName("Cebu Chamber of Commerce & Industry");
                st2.setEmail("info@cebuchamber.org");
                st2.setPhoneNumber("+63 32 232 1421");
                st2.setCity("Cebu City");
                st2.setProvince("Cebu");
                st2.setRegion("Region VII (Central Visayas)");
                st2.setLocationLat(10.3120);
                st2.setLocationLng(123.8920);
                st2.setLocationName("CCC Building, Cebu City");

                Stakeholder st3 = new Stakeholder();
                st3.setName("USC Innovation & Technology Transfer Office");
                st3.setEmail("itto@usc.edu.ph");
                st3.setPhoneNumber("+63 32 230 0100");
                st3.setCity("Cebu City");
                st3.setProvince("Cebu");
                st3.setRegion("Region VII (Central Visayas)");
                st3.setLocationLat(10.3540);
                st3.setLocationLng(123.9130);
                st3.setLocationName("USC Talamban Campus, Cebu City");

                stakeholderRepository.saveAll(List.of(st1, st2, st3));
                log.info("Sample stakeholders seeded successfully.");
            }
        } catch (Exception e) {
            log.warn("DataInitializer failed: {}", e.getMessage(), e);
        }
    }
}