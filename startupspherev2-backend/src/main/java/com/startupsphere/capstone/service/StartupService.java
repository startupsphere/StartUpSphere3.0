package com.startupsphere.capstone.service;

import java.io.IOException;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Random;

import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.startupsphere.capstone.entity.Startup;
import com.startupsphere.capstone.entity.User;
import com.startupsphere.capstone.repository.BookmarksRepository;
import com.startupsphere.capstone.repository.LikeRepository;
import com.startupsphere.capstone.repository.StartupRepository;
import com.startupsphere.capstone.repository.ViewsRepository;

@Service
public class StartupService {

    private static final Logger logger = LoggerFactory.getLogger(StartupService.class);
    
    private final StartupRepository startupRepository;
    private final ViewsRepository viewsRepository;
    private final LikeRepository likeRepository;
    private final BookmarksRepository bookmarksRepository;
    private final EntityManager entityManager;
    private final EmailService emailService;

    public StartupService(
            StartupRepository startupRepository,
            ViewsRepository viewsRepository,
            LikeRepository likeRepository,
            BookmarksRepository bookmarksRepository,
            EntityManager entityManager,
            EmailService emailService) {
        this.startupRepository = startupRepository;
        this.viewsRepository = viewsRepository;
        this.likeRepository = likeRepository;
        this.bookmarksRepository = bookmarksRepository;
        this.entityManager = entityManager;
        this.emailService = emailService;
    }

    @Transactional
    @CacheEvict(value = {"startups", "submittedStartups", "filteredStartups"}, allEntries = true)
    public Startup createStartup(Startup startup) {
        logger.info("Saving startup: {}", startup.getCompanyName());

        // TEMPORARY: Auto-accept startups for testing
        startup.setStatus("Approved");
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
        // TEMPORARY: Auto-accept startups for testing
        draft.setStatus("Approved");
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
                    startup.setVerificationCodeExpiresAt(updatedStartup.getVerificationCodeExpiresAt());
                    startup.setEmailVerified(updatedStartup.getEmailVerified());
                    startup.setTrlLevel(updatedStartup.getTrlLevel());
                    startup.setVerifiedCredentials(updatedStartup.getVerifiedCredentials());
                    startup.setHasSupports(updatedStartup.getHasSupports());
                    startup.setSupportProvider(updatedStartup.getSupportProvider());
                    startup.setSupportProgram(updatedStartup.getSupportProgram());

                    // Social metrics
                    if (updatedStartup.getFacebookFollowers() != null) {
                        startup.setFacebookFollowers(updatedStartup.getFacebookFollowers());
                    }
                    if (updatedStartup.getFacebookLikes() != null) {
                        startup.setFacebookLikes(updatedStartup.getFacebookLikes());
                    }
                    if (updatedStartup.getInstagramFollowers() != null) {
                        startup.setInstagramFollowers(updatedStartup.getInstagramFollowers());
                    }

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
        return startupRepository.searchAllFields(query, pageable);
    }

    public List<Startup> searchStartups(String query) {
        return startupRepository.searchAllFields(query);
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
        if (updatedDraft.getFacebookFollowers() != null) {
            existingDraft.setFacebookFollowers(updatedDraft.getFacebookFollowers());
        }
        if (updatedDraft.getFacebookLikes() != null) {
            existingDraft.setFacebookLikes(updatedDraft.getFacebookLikes());
        }
        if (updatedDraft.getInstagramFollowers() != null) {
            existingDraft.setInstagramFollowers(updatedDraft.getInstagramFollowers());
        }
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
        existingDraft.setTrlLevel(updatedDraft.getTrlLevel());
        existingDraft.setVerifiedCredentials(updatedDraft.getVerifiedCredentials());
        existingDraft.setHasSupports(updatedDraft.getHasSupports());
        existingDraft.setSupportProvider(updatedDraft.getSupportProvider());
        existingDraft.setSupportProgram(updatedDraft.getSupportProgram());
        
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

        String recipientEmail = (email != null && !email.isBlank()) ? email.trim() : startup.getContactEmail();
        if (recipientEmail == null || recipientEmail.isBlank()) {
            throw new RuntimeException("No email address provided for verification.");
        }

        // Generate a secure 6-digit verification code using SecureRandom
        SecureRandom secureRandom = new SecureRandom();
        String verificationCode = String.format("%06d", 100000 + secureRandom.nextInt(900000));
        startup.setVerificationCode(verificationCode);
        startup.setVerificationCodeExpiresAt(LocalDateTime.now().plusMinutes(10));
        startup.setEmailVerified(false);
        startupRepository.save(startup);

        emailService.sendOtpVerificationEmail(recipientEmail, startup.getCompanyName(), verificationCode);
    }

    @Transactional
    public void verifyEmail(Long startupId, String email, String code) {
        Startup startup = startupRepository.findById(startupId)
                .orElseThrow(() -> new RuntimeException("Startup not found with id: " + startupId));

        if (code == null || code.trim().length() < 4) {
            throw new RuntimeException("Please enter a valid verification code (at least 4 digits).");
        }

        String sanitizedCode = code.trim().replace(" ", "").replace("-", "");
        if (startup.getVerificationCode() == null || !startup.getVerificationCode().trim().equals(sanitizedCode)) {
            throw new RuntimeException("Invalid verification code. Please check your email and try again.");
        }

        if (startup.getVerificationCodeExpiresAt() != null && LocalDateTime.now().isAfter(startup.getVerificationCodeExpiresAt())) {
            throw new RuntimeException("Verification code has expired. Please click 'Resend Code' to receive a new one.");
        }

        startup.setEmailVerified(true);
        startup.setVerificationCode(null);
        startup.setVerificationCodeExpiresAt(null);
        startupRepository.save(startup);
        logger.info("Email verified successfully for startup ID: {}", startupId);
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
        emailService.sendReminderEmail(toEmail, companyName);
    }

    public Page<Startup> getStartupsWithFilters(
            String industry,
            String status,
            String region,
            String search,
            String startDate,
            String endDate,
            Pageable pageable) {

        StringBuilder jpql = new StringBuilder("SELECT s FROM Startup s WHERE s.isDraft = false");
        StringBuilder countJpql = new StringBuilder("SELECT COUNT(s) FROM Startup s WHERE s.isDraft = false");
        Map<String, Object> params = new HashMap<>();

        if (industry != null && !industry.trim().isEmpty()) {
            jpql.append(" AND s.industry = :industry");
            countJpql.append(" AND s.industry = :industry");
            params.put("industry", industry);
        }
        if (status != null && !status.trim().isEmpty()) {
            jpql.append(" AND s.status = :status");
            countJpql.append(" AND s.status = :status");
            params.put("status", status);
        }
        if (region != null && !region.trim().isEmpty()) {
            jpql.append(" AND s.region = :region");
            countJpql.append(" AND s.region = :region");
            params.put("region", region);
        }
        if (search != null && !search.trim().isEmpty()) {
            jpql.append(" AND LOWER(s.companyName) LIKE :search");
            countJpql.append(" AND LOWER(s.companyName) LIKE :search");
            params.put("search", "%" + search.toLowerCase() + "%");
        }
        if (startDate != null && !startDate.trim().isEmpty()) {
            LocalDateTime parsedStartDate = LocalDate.parse(startDate).atStartOfDay();
            jpql.append(" AND s.createdAt >= :startDate");
            countJpql.append(" AND s.createdAt >= :startDate");
            params.put("startDate", parsedStartDate);
        }
        if (endDate != null && !endDate.trim().isEmpty()) {
            LocalDateTime parsedEndDate = LocalDate.parse(endDate).atTime(23, 59, 59);
            jpql.append(" AND s.createdAt <= :endDate");
            countJpql.append(" AND s.createdAt <= :endDate");
            params.put("endDate", parsedEndDate);
        }

        // Apply sorting
        if (pageable.getSort().isSorted()) {
            jpql.append(" ORDER BY ");
            pageable.getSort().forEach(order -> {
                jpql.append("s.").append(order.getProperty()).append(" ").append(order.getDirection().name()).append(", ");
            });
            jpql.setLength(jpql.length() - 2);
        } else {
            jpql.append(" ORDER BY s.companyName ASC");
        }

        TypedQuery<Startup> query = entityManager.createQuery(jpql.toString(), Startup.class);
        TypedQuery<Long> countQuery = entityManager.createQuery(countJpql.toString(), Long.class);

        for (Map.Entry<String, Object> entry : params.entrySet()) {
            query.setParameter(entry.getKey(), entry.getValue());
            countQuery.setParameter(entry.getKey(), entry.getValue());
        }

        long total = countQuery.getSingleResult();

        query.setFirstResult((int) pageable.getOffset());
        query.setMaxResults(pageable.getPageSize());

        List<Startup> content = query.getResultList();

        return new org.springframework.data.domain.PageImpl<>(content, pageable, total);
    }

    public List<Startup> getStartupsWithFilters(
            String industry,
            String status,
            String region,
            String search,
            String startDate,
            String endDate) {

        StringBuilder jpql = new StringBuilder("SELECT s FROM Startup s WHERE s.isDraft = false");
        Map<String, Object> params = new HashMap<>();

        if (industry != null && !industry.trim().isEmpty()) {
            jpql.append(" AND s.industry = :industry");
            params.put("industry", industry);
        }
        if (status != null && !status.trim().isEmpty()) {
            jpql.append(" AND s.status = :status");
            params.put("status", status);
        }
        if (region != null && !region.trim().isEmpty()) {
            jpql.append(" AND s.region = :region");
            params.put("region", region);
        }
        if (search != null && !search.trim().isEmpty()) {
            jpql.append(" AND LOWER(s.companyName) LIKE :search");
            params.put("search", "%" + search.toLowerCase() + "%");
        }
        if (startDate != null && !startDate.trim().isEmpty()) {
            LocalDateTime parsedStartDate = LocalDate.parse(startDate).atStartOfDay();
            jpql.append(" AND s.createdAt >= :startDate");
            params.put("startDate", parsedStartDate);
        }
        if (endDate != null && !endDate.trim().isEmpty()) {
            LocalDateTime parsedEndDate = LocalDate.parse(endDate).atTime(23, 59, 59);
            jpql.append(" AND s.createdAt <= :endDate");
            params.put("endDate", parsedEndDate);
        }

        jpql.append(" ORDER BY s.companyName ASC");

        TypedQuery<Startup> query = entityManager.createQuery(jpql.toString(), Startup.class);
        for (Map.Entry<String, Object> entry : params.entrySet()) {
            query.setParameter(entry.getKey(), entry.getValue());
        }

        return query.getResultList();
    }

    public List<String> getDistinctIndustries() {
        return startupRepository.findDistinctIndustries();
    }
}