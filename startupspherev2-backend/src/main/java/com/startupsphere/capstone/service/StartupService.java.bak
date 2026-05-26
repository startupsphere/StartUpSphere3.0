package com.startupsphere.capstone.service;

import com.sendgrid.Method;
import com.sendgrid.Request;
import com.sendgrid.SendGrid;
import com.sendgrid.Response;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;
import com.startupsphere.capstone.entity.Bookmarks;
import com.startupsphere.capstone.entity.Like;
import com.startupsphere.capstone.entity.Startup;
import com.startupsphere.capstone.entity.User;
import com.startupsphere.capstone.entity.Views;
import com.startupsphere.capstone.repository.BookmarksRepository;
import com.startupsphere.capstone.repository.LikeRepository;
import com.startupsphere.capstone.repository.StartupRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.startupsphere.capstone.repository.ViewsRepository;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Random;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;

@Service
public class StartupService {

    private static final Logger logger = LoggerFactory.getLogger(StartupService.class);
    
    @Value("${sendgrid.api.key}")
    private String sendgridApiKey;

    @Value("${sendgrid.from.email:default@startupsphere.com}")
    private String fromEmail;

    @Value("${sendgrid.from.name:StartupSphere}")
    private String fromName;

    private final StartupRepository startupRepository;
    private final ViewsRepository viewsRepository;
    private final LikeRepository likeRepository;
    private final BookmarksRepository bookmarksRepository;
    // Removed JavaMailSender dependency

    public StartupService(
            StartupRepository startupRepository,
            ViewsRepository viewsRepository,
            LikeRepository likeRepository,
            BookmarksRepository bookmarksRepository) {
        this.startupRepository = startupRepository;
        this.viewsRepository = viewsRepository;
        this.likeRepository = likeRepository;
        this.bookmarksRepository = bookmarksRepository;
    }

    @Transactional
    @CacheEvict(value = {"startups", "submittedStartups", "filteredStartups"}, allEntries = true)
    public Startup createStartup(Startup startup) {
        logger.info("Saving startup: {}", startup.getCompanyName());

        startup.setStatus("In Review");
        startup.setIsDraft(false);
        return startupRepository.save(startup);
    }

    @Transactional
    public Startup saveDraft(Startup startup) {
        logger.info("Saving draft: {}", startup.getCompanyName());

        startup.setIsDraft(true);
        startup.setStatus("Draft");
        startup.setEmailVerified(false);
        return startupRepository.save(startup);
    }

    @Transactional
    public Startup submitDraft(Long draftId, Integer userId) {
        logger.info("Submitting draft with ID: {}", draftId);
        
        Startup draft = startupRepository.findById(draftId)
                .orElseThrow(() -> new RuntimeException("Draft not found with id: " + draftId));
        
        // Verify the draft belongs to the user
        if (!draft.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized: Draft does not belong to user");
        }
        
        // Verify it's actually a draft
        if (!draft.getIsDraft()) {
            throw new RuntimeException("Startup is not a draft");
        }
        
        draft.setIsDraft(false);
        draft.setStatus("In Review");
        return startupRepository.save(draft);
    }

    @Cacheable(value = "startups", key = "#pageable.pageNumber + '-' + #pageable.pageSize + '-' + #pageable.sort.toString()")
    public Page<Startup> getAllStartups(Pageable pageable) {
        return startupRepository.findAll(pageable);
    }

    public List<Startup> getAllStartups() {
        return startupRepository.findAll();
    }

    @Cacheable(value = "startupById", key = "#id")
    public Optional<Startup> getStartupById(Long id) {
        return startupRepository.findById(id);
    }

    @Transactional
    @CacheEvict(value = {"startups", "startupById", "approvedStartups", "submittedStartups", "emailVerifiedStartups", "searchStartups", "filteredStartups"}, allEntries = true)
    public Startup updateStartup(Long id, Startup updatedStartup) {
        return startupRepository.findById(id)
                .map(startup -> {
                    updatedStartup.setId(startup.getId());
                    updatedStartup.setUser(startup.getUser());
                    updatedStartup.setLikes(startup.getLikes());
                    updatedStartup.setBookmarks(startup.getBookmarks());
                    updatedStartup.setViews(startup.getViews());

                    startup.setCompanyName(updatedStartup.getCompanyName());
                    startup.setCompanyDescription(updatedStartup.getCompanyDescription());
                    startup.setFoundedDate(updatedStartup.getFoundedDate());
                    startup.setTypeOfCompany(updatedStartup.getTypeOfCompany());
                    startup.setNumberOfEmployees(updatedStartup.getNumberOfEmployees());
                    startup.setPhoneNumber(updatedStartup.getPhoneNumber());
                    startup.setContactEmail(updatedStartup.getContactEmail());
                    startup.setStreetAddress(updatedStartup.getStreetAddress());
                    startup.setCity(updatedStartup.getCity());
                    startup.setStatus(updatedStartup.getStatus());
                    startup.setProvince(updatedStartup.getProvince());
                    startup.setPostalCode(updatedStartup.getPostalCode());
                    startup.setIndustry(updatedStartup.getIndustry());
                    startup.setWebsite(updatedStartup.getWebsite());
                    startup.setFacebook(updatedStartup.getFacebook());
                    startup.setTwitter(updatedStartup.getTwitter());
                    startup.setInstagram(updatedStartup.getInstagram());
                    startup.setLinkedIn(updatedStartup.getLinkedIn());
                    startup.setLocationLat(updatedStartup.getLocationLat());
                    startup.setLocationLng(updatedStartup.getLocationLng());
                    startup.setLocationName(updatedStartup.getLocationName());
                    startup.setStartupCode(updatedStartup.getStartupCode());
                    startup.setRevenue(updatedStartup.getRevenue());
                    startup.setAnnualRevenue(updatedStartup.getAnnualRevenue());
                    startup.setPaidUpCapital(updatedStartup.getPaidUpCapital());
                    startup.setFundingStage(updatedStartup.getFundingStage());
                    startup.setBusinessActivity(updatedStartup.getBusinessActivity());
                    startup.setOperatingHours(updatedStartup.getOperatingHours());
                    startup.setNumberOfActiveStartups(updatedStartup.getNumberOfActiveStartups());
                    startup.setNumberOfNewStartupsThisYear(updatedStartup.getNumberOfNewStartupsThisYear());
                    startup.setAverageStartupGrowthRate(updatedStartup.getAverageStartupGrowthRate());
                    startup.setStartupSurvivalRate(updatedStartup.getStartupSurvivalRate());
                    startup.setTotalStartupFundingReceived(updatedStartup.getTotalStartupFundingReceived());
                    startup.setAverageFundingPerStartup(updatedStartup.getAverageFundingPerStartup());
                    startup.setNumberOfFundingRounds(updatedStartup.getNumberOfFundingRounds());
                    startup.setRegion(updatedStartup.getRegion());
                    startup.setBarangay(updatedStartup.getBarangay());
                    startup.setNumberOfStartupsWithForeignInvestment(
                            updatedStartup.getNumberOfStartupsWithForeignInvestment());
                    startup.setAmountOfGovernmentGrantsOrSubsidiesReceived(
                            updatedStartup.getAmountOfGovernmentGrantsOrSubsidiesReceived());
                    startup.setNumberOfStartupIncubatorsOrAccelerators(
                            updatedStartup.getNumberOfStartupIncubatorsOrAccelerators());
                    startup.setNumberOfStartupsInIncubationPrograms(
                            updatedStartup.getNumberOfStartupsInIncubationPrograms());
                    startup.setNumberOfMentorsOrAdvisorsInvolved(updatedStartup.getNumberOfMentorsOrAdvisorsInvolved());
                    startup.setPublicPrivatePartnershipsInvolvingStartups(
                            updatedStartup.getPublicPrivatePartnershipsInvolvingStartups());
                    startup.setVerificationCode(updatedStartup.getVerificationCode());
                    startup.setEmailVerified(updatedStartup.getEmailVerified());

                    // Registration & Compliance fields
                    startup.setIsGovernmentRegistered(updatedStartup.getIsGovernmentRegistered());
                    startup.setRegistrationAgency(updatedStartup.getRegistrationAgency());
                    startup.setRegistrationNumber(updatedStartup.getRegistrationNumber());
                    startup.setRegistrationDate(updatedStartup.getRegistrationDate());
                    startup.setOtherRegistrationAgency(updatedStartup.getOtherRegistrationAgency());
                    startup.setBusinessLicenseNumber(updatedStartup.getBusinessLicenseNumber());
                    startup.setTin(updatedStartup.getTin());

                    if (updatedStartup.getIsDraft() != null) {
                        startup.setIsDraft(updatedStartup.getIsDraft());
                    }

                    if (updatedStartup.getPhoto() != null) {
                        startup.setPhoto(updatedStartup.getPhoto());
                    }
                    if (updatedStartup.getRegistrationCertificate() != null) {
                        startup.setRegistrationCertificate(updatedStartup.getRegistrationCertificate());
                    }

                    return startupRepository.save(startup);
                })
                .orElseThrow(() -> new RuntimeException("Startup not found with id: " + id));
    }

    @Transactional
    public void deleteStartup(Long id) {
        logger.info("Attempting to delete startup with id: {}", id);

        try {
            // First verify the startup exists
            if (!startupRepository.existsById(id)) {
                throw new RuntimeException("Startup not found with id: " + id);
            }

            // Delete related entities first using bulk operations to avoid cascade issues
            // This approach bypasses the entity relationships and directly deletes from DB
            viewsRepository.deleteByStartupId(id);
            likeRepository.deleteByStartupId(id);
            bookmarksRepository.deleteByStartupId(id);

            // Force flush to ensure all related entities are deleted
            startupRepository.flush();

            // Now safely delete the startup
            startupRepository.deleteById(id);

            logger.info("Successfully deleted startup with id: {}", id);

        } catch (Exception e) {
            logger.error("Error deleting startup with id: {}. Error: {}", id, e.getMessage(), e);
            throw new RuntimeException("Failed to delete startup with id: " + id + ". Error: " + e.getMessage());
        }
    }

    // Alternative Option 2: Manual deletion with proper repository methods
    @Transactional
    public void deleteStartupManual(Long id) {
        logger.info("Attempting to delete startup with id: {}", id);

        try {
            Startup startup = startupRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Startup not found with id: " + id));

            // Delete related entities using repository methods (bulk operations)
            viewsRepository.deleteByStartup(startup);
            likeRepository.deleteByStartup(startup);
            bookmarksRepository.deleteByStartup(startup);

            // Now delete the startup
            startupRepository.delete(startup);

            logger.info("Successfully deleted startup with id: {}", id);

        } catch (Exception e) {
            logger.error("Error deleting startup with id: {}. Error: {}", id, e.getMessage(), e);
            throw new RuntimeException("Failed to delete startup with id: " + id + ". Error: " + e.getMessage());
        }
    }

    // Option 3: Using JPQL bulk delete (most efficient for large datasets)
    @Transactional
    public void deleteStartupBulk(Long id) {
        logger.info("Attempting to delete startup with id: {}", id);

        try {
            // Verify startup exists
            if (!startupRepository.existsById(id)) {
                throw new RuntimeException("Startup not found with id: " + id);
            }

            // Delete related entities using bulk operations
            viewsRepository.deleteByStartupId(id);
            likeRepository.deleteByStartupId(id);
            bookmarksRepository.deleteByStartupId(id);

            // Delete the startup
            startupRepository.deleteById(id);

            logger.info("Successfully deleted startup with id: {}", id);

        } catch (Exception e) {
            logger.error("Error deleting startup with id: {}. Error: {}", id, e.getMessage(), e);
            throw new RuntimeException("Failed to delete startup with id: " + id + ". Error: " + e.getMessage());
        }
    }

    public Page<Startup> searchStartups(String query, Pageable pageable) {
        return startupRepository.findByCompanyNameContainingIgnoreCase(query, pageable);
    }

    public List<Startup> searchStartups(String query) {
        return startupRepository.findByCompanyNameContainingIgnoreCase(query);
    }

    public List<Long> getStartupIdsByLoggedInUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()
                || authentication.getPrincipal().equals("anonymousUser")) {
            throw new RuntimeException("User not authenticated");
        }
        User loggedInUser = (User) authentication.getPrincipal();
        return startupRepository.findByUser_Id(loggedInUser.getId())
                .stream()
                .map(Startup::getId)
                .toList();
    }

    public Page<Startup> getAllSubmittedStartups(Pageable pageable) {
        logger.info("Fetching paginated submitted startups (non-drafts only)");
        return startupRepository.findByStatusAndIsDraftFalse("In Review", pageable);
    }

    public List<Startup> getAllSubmittedStartups() {
        logger.info("Fetching all submitted startups (non-drafts only)");
        return startupRepository.findByStatusAndIsDraftFalse("In Review");
    }

    public List<Startup> getStartupsByLoggedInUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()
                || authentication.getPrincipal().equals("anonymousUser")) {
            throw new RuntimeException("User not authenticated");
        }
        User loggedInUser = (User) authentication.getPrincipal();
        return startupRepository.findByUser_Id(loggedInUser.getId());
    }

    public List<Startup> getDraftsByLoggedInUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()
                || authentication.getPrincipal().equals("anonymousUser")) {
            throw new RuntimeException("User not authenticated");
        }
        User loggedInUser = (User) authentication.getPrincipal();
        logger.info("Fetching drafts for user ID: {}", loggedInUser.getId());
        return startupRepository.findByUser_IdAndIsDraftTrue(loggedInUser.getId());
    }

    public Startup getDraftById(Long id, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()
                || authentication.getPrincipal().equals("anonymousUser")) {
            throw new RuntimeException("User not authenticated");
        }
        User loggedInUser = (User) authentication.getPrincipal();
        
        Startup startup = startupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Draft not found with id: " + id));
        
        // Verify it's a draft
        if (!startup.getIsDraft()) {
            throw new RuntimeException("Startup with id " + id + " is not a draft");
        }
        
        // Verify it belongs to the logged-in user
        if (!startup.getUser().getId().equals(loggedInUser.getId())) {
            throw new RuntimeException("Unauthorized: Draft does not belong to user");
        }
        
        logger.info("Fetched draft with ID: {} for user ID: {}", id, loggedInUser.getId());
        return startup;
    }

    @Transactional
    public Startup updateDraft(Long id, Startup updatedDraft, Integer userId) {
        logger.info("Updating draft with ID: {}", id);
        
        Startup existingDraft = startupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Draft not found with id: " + id));
        
        // Verify the draft belongs to the user
        if (!existingDraft.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized: Draft does not belong to user");
        }
        
        // Verify it's actually a draft
        if (!existingDraft.getIsDraft()) {
            throw new RuntimeException("Startup with id " + id + " is not a draft");
        }
        
        // Update all fields while maintaining draft status
        existingDraft.setCompanyName(updatedDraft.getCompanyName());
        existingDraft.setCompanyDescription(updatedDraft.getCompanyDescription());
        existingDraft.setFoundedDate(updatedDraft.getFoundedDate());
        existingDraft.setTypeOfCompany(updatedDraft.getTypeOfCompany());
        existingDraft.setNumberOfEmployees(updatedDraft.getNumberOfEmployees());
        existingDraft.setPhoneNumber(updatedDraft.getPhoneNumber());
        existingDraft.setContactEmail(updatedDraft.getContactEmail());
        existingDraft.setStreetAddress(updatedDraft.getStreetAddress());
        existingDraft.setCity(updatedDraft.getCity());
        existingDraft.setProvince(updatedDraft.getProvince());
        existingDraft.setRegion(updatedDraft.getRegion());
        existingDraft.setBarangay(updatedDraft.getBarangay());
        existingDraft.setPostalCode(updatedDraft.getPostalCode());
        existingDraft.setIndustry(updatedDraft.getIndustry());
        existingDraft.setWebsite(updatedDraft.getWebsite());
        existingDraft.setFacebook(updatedDraft.getFacebook());
        existingDraft.setTwitter(updatedDraft.getTwitter());
        existingDraft.setInstagram(updatedDraft.getInstagram());
        existingDraft.setLinkedIn(updatedDraft.getLinkedIn());
        existingDraft.setLocationLat(updatedDraft.getLocationLat());
        existingDraft.setLocationLng(updatedDraft.getLocationLng());
        existingDraft.setLocationName(updatedDraft.getLocationName());
        existingDraft.setStartupCode(updatedDraft.getStartupCode());
        existingDraft.setRevenue(updatedDraft.getRevenue());
        existingDraft.setAnnualRevenue(updatedDraft.getAnnualRevenue());
        existingDraft.setPaidUpCapital(updatedDraft.getPaidUpCapital());
        existingDraft.setFundingStage(updatedDraft.getFundingStage());
        existingDraft.setBusinessActivity(updatedDraft.getBusinessActivity());
        existingDraft.setOperatingHours(updatedDraft.getOperatingHours());
        existingDraft.setNumberOfActiveStartups(updatedDraft.getNumberOfActiveStartups());
        existingDraft.setNumberOfNewStartupsThisYear(updatedDraft.getNumberOfNewStartupsThisYear());
        existingDraft.setAverageStartupGrowthRate(updatedDraft.getAverageStartupGrowthRate());
        existingDraft.setStartupSurvivalRate(updatedDraft.getStartupSurvivalRate());
        existingDraft.setTotalStartupFundingReceived(updatedDraft.getTotalStartupFundingReceived());
        existingDraft.setAverageFundingPerStartup(updatedDraft.getAverageFundingPerStartup());
        existingDraft.setNumberOfFundingRounds(updatedDraft.getNumberOfFundingRounds());
        existingDraft.setNumberOfStartupsWithForeignInvestment(updatedDraft.getNumberOfStartupsWithForeignInvestment());
        existingDraft.setAmountOfGovernmentGrantsOrSubsidiesReceived(updatedDraft.getAmountOfGovernmentGrantsOrSubsidiesReceived());
        existingDraft.setNumberOfStartupIncubatorsOrAccelerators(updatedDraft.getNumberOfStartupIncubatorsOrAccelerators());
        existingDraft.setNumberOfStartupsInIncubationPrograms(updatedDraft.getNumberOfStartupsInIncubationPrograms());
        existingDraft.setNumberOfMentorsOrAdvisorsInvolved(updatedDraft.getNumberOfMentorsOrAdvisorsInvolved());
        existingDraft.setPublicPrivatePartnershipsInvolvingStartups(updatedDraft.getPublicPrivatePartnershipsInvolvingStartups());
        existingDraft.setIsGovernmentRegistered(updatedDraft.getIsGovernmentRegistered());
        existingDraft.setRegistrationAgency(updatedDraft.getRegistrationAgency());
        existingDraft.setRegistrationNumber(updatedDraft.getRegistrationNumber());
        existingDraft.setRegistrationDate(updatedDraft.getRegistrationDate());
        existingDraft.setOtherRegistrationAgency(updatedDraft.getOtherRegistrationAgency());
        existingDraft.setBusinessLicenseNumber(updatedDraft.getBusinessLicenseNumber());
        existingDraft.setTin(updatedDraft.getTin());
        
        // Keep draft status and draft flag
        existingDraft.setIsDraft(true);
        existingDraft.setStatus("Draft");
        
        Startup saved = startupRepository.save(existingDraft);
        logger.info("Successfully updated draft with ID: {}", id);
        return saved;
    }

    @Transactional
    public void deleteDraft(Long id, Integer userId) {
        logger.info("Deleting draft with ID: {}", id);
        
        Startup draft = startupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Draft not found with id: " + id));
        
        // Verify the draft belongs to the user
        if (!draft.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized: Draft does not belong to user");
        }
        
        // Verify it's actually a draft
        if (!draft.getIsDraft()) {
            throw new RuntimeException("Startup with id " + id + " is not a draft. Cannot delete non-draft startups through this endpoint.");
        }
        
        startupRepository.delete(draft);
        logger.info("Successfully deleted draft with ID: {}", id);
    }

    public void sendVerificationEmail(Long startupId, String email) {
        logger.info("Attempting to send verification email for startup ID: {} to email: {}", startupId, email);

        Startup startup = startupRepository.findById(startupId)
                .orElseThrow(() -> {
                    logger.error("Startup not found with id: {}", startupId);
                    return new RuntimeException("Startup not found with id: " + startupId);
                });

        String verificationCode = String.format("%06d", new Random().nextInt(999999));
        startup.setVerificationCode(verificationCode);
        startup.setEmailVerified(false);
        startupRepository.save(startup);

        // Use SendGrid configuration
        Email from = new Email(fromEmail, fromName);
        Email to = new Email(email);
        Content content = new Content("text/plain",
            "Hello,\n\nYour verification code for StartupSphere is: " + verificationCode +
            "\n\nPlease enter this code to verify your email address.\n\n" +
            "If you didn't request this, please ignore this email.\n\n" +
            "Best regards,\nStartupSphere Team");

        Mail mail = new Mail(from, "Verify Your Email - StartupSphere", to, content);

        SendGrid sg = new SendGrid(sendgridApiKey);
        Request request = new Request();
        try {
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());
            Response response = sg.api(request);

            logger.info("SendGrid response status: {}", response.getStatusCode());
            logger.debug("SendGrid response body: {}", response.getBody());

            if (response.getStatusCode() >= 200 && response.getStatusCode() < 300) {
                logger.info("Verification email sent successfully to {}", email);
            } else {
                logger.error("Failed to send verification email to {}: Status {} - {}",
                    email, response.getStatusCode(), response.getBody());
                throw new RuntimeException("Failed to send email: HTTP " + response.getStatusCode() + " - " + response.getBody());
            }
        } catch (IOException e) {
            logger.error("IOException while sending verification email to {}: {}", email, e.getMessage(), e);
            throw new RuntimeException("Failed to send email: " + e.getMessage(), e);
        }
    }

    @Transactional
    public void verifyEmail(Long startupId, String email, String code) {
        Optional<Startup> startupOpt = startupRepository.findByContactEmailAndVerificationCode(email, code);
        if (startupOpt.isEmpty()) {
            throw new RuntimeException("Invalid verification code");
        }

        Startup startup = startupOpt.get();
        if (!startup.getId().equals(startupId)) {
            throw new RuntimeException("Startup ID does not match the provided email and code");
        }

        startup.setEmailVerified(true);
        startup.setVerificationCode(null);
        startupRepository.save(startup);
        logger.info("Email verified for startup ID: {}", startupId);
    }

    public Page<Startup> getAllEmailVerifiedStartups(Pageable pageable) {
        return startupRepository.findAllVerifiedEmailStartups(pageable);
    }

    public List<Startup> getAllEmailVerifiedStartups() {
        return startupRepository.findAllVerifiedEmailStartups();
    }

    @Transactional
    public Startup approveStartup(Long id) {
        Startup startup = startupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Startup not found with id: " + id));

        startup.setStatus("Approved");
        return startupRepository.save(startup);
    }

    @Transactional
    public Startup rejectStartup(Long id) {
        Startup startup = startupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Startup not found with id: " + id));

        startup.setStatus("Rejected");
        return startupRepository.save(startup);
    }

    public Page<Startup> getAllApprovedStartups(Pageable pageable) {
        return startupRepository.findAllApprovedStartups(pageable);
    }

    public List<Startup> getAllApprovedStartups() {
        return startupRepository.findAllApprovedStartups();
    }

    @Scheduled(cron = "0 0 9 * * ?")
    @Transactional
    public void sendUpdateReminderEmails() {
        logger.info("Checking for startups needing update reminders");
        LocalDateTime sixMonthsAgo = LocalDateTime.now().minusMonths(6); // Change to .minusMinutes(5) for testing
        List<Startup> startups = startupRepository.findStartupsNotUpdatedSince(sixMonthsAgo);

        for (Startup startup : startups) {
            try {
                sendReminderEmail(startup.getContactEmail(), startup.getCompanyName());
                logger.info("Reminder email sent to {} for startup ID: {}", startup.getContactEmail(), startup.getId());
            } catch (Exception e) {
                logger.error("Failed to send reminder email to {}: {}", startup.getContactEmail(), e.getMessage(), e);
            }
        }
    }

    private void sendReminderEmail(String toEmail, String companyName) {
        Email from = new Email(fromEmail, fromName);
        Email to = new Email(toEmail);
        Content content = new Content("text/plain",
            "Dear " + companyName + ",\n\n" +
            "It has been over 6 months since your startup information was last updated. " +
            "To ensure your data remains relevant and verified, please update your details.\n\n" +
            "You can update your information by logging into your account and visiting the startup dashboard.\n\n" +
            "Thank you,\nStartupSphere Team");

        Mail mail = new Mail(from, "Reminder: Update Your Startup Information", to, content);

        SendGrid sg = new SendGrid(sendgridApiKey);
        Request request = new Request();
        try {
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());
            Response response = sg.api(request);

            if (response.getStatusCode() >= 200 && response.getStatusCode() < 300) {
                logger.info("Reminder email sent successfully to {}", toEmail);
            } else {
                logger.error("Failed to send reminder email to {}: Status {} - {}",
                    toEmail, response.getStatusCode(), response.getBody());
                throw new RuntimeException("Failed to send reminder email: HTTP " + response.getStatusCode() + " - " + response.getBody());
            }
        } catch (IOException e) {
            logger.error("IOException while sending reminder email to {}: {}", toEmail, e.getMessage(), e);
            throw new RuntimeException("Failed to send reminder email: " + e.getMessage(), e);
        }
    }

    public Page<Startup> getStartupsWithFilters(
            String industry,
            String status,
            String region,
            String search,
            String startDate,
            String endDate,
            Pageable pageable) {

        LocalDateTime parsedStartDate = startDate != null ?
                LocalDate.parse(startDate).atStartOfDay() : null;
        LocalDateTime parsedEndDate = endDate != null ?
                LocalDate.parse(endDate).atTime(23, 59, 59) : null;

        return startupRepository.findStartupsWithFilters(
                industry,
                status,
                region,
                search,
                parsedStartDate,
                parsedEndDate,
                pageable
        );
    }

    public List<Startup> getStartupsWithFilters(
            String industry,
            String status,
            String region,
            String search,
            String startDate,
            String endDate) {

        LocalDateTime parsedStartDate = startDate != null ?
                LocalDate.parse(startDate).atStartOfDay() : null;
        LocalDateTime parsedEndDate = endDate != null ?
                LocalDate.parse(endDate).atTime(23, 59, 59) : null;

        return startupRepository.findStartupsWithFilters(
                industry,
                status,
                region,
                search,
                parsedStartDate,
                parsedEndDate
        );
    }

    public List<String> getDistinctIndustries() {
        return startupRepository.findDistinctIndustries();
    }
}